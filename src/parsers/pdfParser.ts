/**
 * pdfParser
 *
 * Extracts text from a PDF File using pdfjs-dist.
 * Pages are processed one at a time to avoid loading the entire document into
 * memory at once. A progress callback is called after each page so the UI can
 * show accurate incremental progress.
 *
 * Architecture note: we use an async generator so callers can start consuming
 * tokens while later pages are still being parsed.
 *
 * Diagram detection (Approach C):
 *   Each page's TextItems include spatial position data (transform[4]=x,
 *   transform[5]=y in PDF user units, y=0 at page bottom). Items are grouped
 *   into horizontal y-bands. A band is classified as a diagram zone when:
 *     1. x-positions are widely scattered (xStdDev > X_SPREAD_MIN), AND
 *     2. Average alphanumeric character count per token is low (< AVG_ALPHA_LEN_MAX), AND
 *     3. The band does NOT consist entirely of single uppercase letters
 *        (which would indicate a table column header row like A / B / C / D).
 *   Contiguous diagram bands within ZONE_MERGE_GAP points of each other are
 *   merged into a single zone. Each detected zone is replaced with the literal
 *   string "\n[Figure]\n" in the page text so downstream consumers receive a
 *   single clean placeholder token rather than garbled label fragments.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Point the worker at the bundled worker file (Vite handles the URL via ?url)
// Use legacy build to avoid ESM worker issues in some browsers
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href;

// ─── Diagram detection constants ─────────────────────────────────────────────

/**
 * Items within this many PDF user units on the y-axis are considered to be on
 * the same visual line. Most body fonts at 10–12pt render lines ≈2–4pt apart
 * within a single line and ≈14pt apart between lines, so 3 is a safe band
 * tolerance that groups same-line items without merging adjacent lines.
 */
const Y_BAND_TOLERANCE = 3;

/**
 * Minimum standard deviation of x-positions within a band for that band to be
 * considered spatially scattered. Body text at a typical 6-inch column width
 * (≈432pt) has items spaced 5–15pt apart. Diagram labels have xStdDev values
 * of 60–200pt. 60 is the conservative lower bound.
 */
const X_SPREAD_MIN = 60;

/**
 * Maximum average alphanumeric character count per token for a band to qualify
 * as a diagram band. Diagram labels are typically 1–2 chars ("D", "A", "→").
 * Body text averages 4–6 chars per token. 2.5 splits these cleanly.
 */
const AVG_ALPHA_LEN_MAX = 2.5;

/**
 * Diagram bands whose y-positions differ by less than this value (in PDF user
 * units) are merged into a single zone. At a typical 11pt body font, one line
 * height ≈ 14pt; 30pt ≈ two line heights, which handles minor vertical gaps
 * within a multi-row diagram without merging across whole paragraphs.
 */
const ZONE_MERGE_GAP = 30;

/**
 * Minimum number of items a band must contain before diagram detection is
 * attempted. Single-item bands cannot exhibit x-spread.
 */
const MIN_BAND_ITEMS = 2;

// ─── Types ───────────────────────────────────────────────────────────────────

/** TextItem shape used internally for spatial diagram analysis. */
interface SpatialTextItem {
  str: string;
  hasEOL?: boolean;
  /** Affine transform: [a, b, c, d, x, y]. x = transform[4], y = transform[5]. */
  transform: number[];
  width: number;
  height: number;
}

export interface ParseProgress {
  pagesProcessed: number;
  totalPages: number;
  /** 0–100 */
  percent: number;
}

// ─── Diagram zone detection ───────────────────────────────────────────────────

/**
 * Returns true when a band of text items has characteristics consistent with
 * a diagram label row rather than prose:
 *   - x-positions are widely scattered (xStdDev > X_SPREAD_MIN)
 *   - average alphanumeric length per token is short (< AVG_ALPHA_LEN_MAX)
 *   - NOT all single uppercase letters (table column-header guard: A B C D)
 */
function isDiagramBand(band: SpatialTextItem[]): boolean {
  const xs = band.map((i) => i.transform[4]);
  const xMean = xs.reduce((s, x) => s + x, 0) / xs.length;
  const xStdDev = Math.sqrt(xs.reduce((s, x) => s + (x - xMean) ** 2, 0) / xs.length);

  if (xStdDev < X_SPREAD_MIN) return false;

  const avgAlphaLen =
    band.reduce((s, i) => s + i.str.replace(/[^a-zA-Z0-9]/g, '').length, 0) / band.length;
  if (avgAlphaLen >= AVG_ALPHA_LEN_MAX) return false;

  // Guard: a row of purely single uppercase letters is a table column header
  // (e.g. "A  B  C  D"), not a diagram. These are valid content and must survive.
  const allSingleUpperAlpha = band.every((i) => /^[A-Z]$/.test(i.str.trim()));
  if (allSingleUpperAlpha) return false;

  return true;
}

/**
 * Analyses all text items on a page and returns an array of [yMin, yMax] pairs
 * (in PDF user units, y=0 at page bottom) that represent detected diagram zones.
 *
 * Algorithm:
 *   1. Sort items by y DESC (top of page first).
 *   2. Group items into horizontal y-bands using Y_BAND_TOLERANCE.
 *   3. Score each band with isDiagramBand().
 *   4. Merge contiguous diagram bands within ZONE_MERGE_GAP into single zones.
 *   5. Return zones as [yMin, yMax] ranges.
 */
function detectDiagramZones(items: SpatialTextItem[]): Array<[number, number]> {
  if (items.length < MIN_BAND_ITEMS * 2) return [];

  // Step 1: sort by y descending (highest y = top of page in PDF coordinates)
  const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5]);

  // Step 2: group into y-bands
  const bands: SpatialTextItem[][] = [];
  let currentBand: SpatialTextItem[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.transform[5] - currentBand[0].transform[5]) <= Y_BAND_TOLERANCE) {
      currentBand.push(item);
    } else {
      bands.push(currentBand);
      currentBand = [item];
    }
  }
  bands.push(currentBand);

  // Step 3: collect y-representative values for diagram bands
  // Representative y = average y of items in the band
  const diagramBandYs: number[] = [];
  for (const band of bands) {
    if (band.length < MIN_BAND_ITEMS) continue;
    if (isDiagramBand(band)) {
      const avgY = band.reduce((s, i) => s + i.transform[5], 0) / band.length;
      diagramBandYs.push(avgY);
    }
  }

  if (diagramBandYs.length === 0) return [];

  // Step 4: merge contiguous diagram bands into zones
  // diagramBandYs is in descending order (top-of-page first)
  const zones: Array<[number, number]> = [];
  let zoneYMax = diagramBandYs[0];    // highest y in zone (top of figure, largest PDF y)
  let zoneYMin = diagramBandYs[0]; // lowest y in zone (bottom of figure, smallest PDF y)

  for (let i = 1; i < diagramBandYs.length; i++) {
    const gap = zoneYMin - diagramBandYs[i]; // positive: next band is below current zone bottom
    if (gap <= ZONE_MERGE_GAP) {
      // Extend the current zone downward
      zoneYMin = diagramBandYs[i];
    } else {
      // Gap too large — finalise current zone and start a new one
      zones.push([zoneYMin - Y_BAND_TOLERANCE, zoneYMax + Y_BAND_TOLERANCE]);
      zoneYMax = diagramBandYs[i];
      zoneYMin = diagramBandYs[i];
    }
  }
  // Push the final zone
  zones.push([zoneYMin - Y_BAND_TOLERANCE, zoneYMax + Y_BAND_TOLERANCE]);

  return zones;
}

/**
 * Async generator that yields one page's worth of text at a time.
 * @param file - The PDF File from the file input
 * @param onProgress - Called after each page is processed
 */
export async function* parsePDF(
  file: File,
  onProgress?: (p: ParseProgress) => void,
): AsyncGenerator<string, void, unknown> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Reconstruct reading order from text items, preserving line breaks.
    // hasEOL is set by pdfjs-dist when a text item ends a visual line in the PDF.
    // Using '\n' at EOL boundaries gives the content normalizer the line
    // structure it needs for header/footer classification (Stage 3 of the
    // ingestion pipeline).  Non-EOL items are joined with a space.
    //
    // Spatial diagram detection: full TextItem shape (including transform[4]=x,
    // transform[5]=y) is read to identify diagram zones. Items within a detected
    // zone are replaced with a single '\n[Figure]\n' placeholder per zone so that
    // garbled label fragments (e.g. "D A → My Thinking") never enter the RSVP
    // word array. See detectDiagramZones() for the detection algorithm.
    const items = textContent.items.filter((item) => 'str' in item) as SpatialTextItem[];

    // Detect diagram zones for this page (returns [] when no diagrams found)
    const diagramZones = detectDiagramZones(items);

    let pageText = '';
    let lastWasFigurePlaceholder = false;

    for (const item of items) {
      const itemY = item.transform[5];
      const inDiagramZone = diagramZones.some(([yMin, yMax]) => itemY >= yMin && itemY <= yMax);

      if (inDiagramZone) {
        // Emit at most one [Figure] placeholder per contiguous diagram zone.
        // lastWasFigurePlaceholder prevents duplicate placeholders for adjacent
        // items within the same zone.
        if (!lastWasFigurePlaceholder) {
          pageText += '\n[Figure]\n';
          lastWasFigurePlaceholder = true;
        }
        // Diagram items are otherwise discarded — do not append item.str
      } else {
        lastWasFigurePlaceholder = false;
        pageText += item.str + ((item.hasEOL ?? false) ? '\n' : ' ');
      }
    }

    pageText = pageText.trim();

    // DEV-mode logging: report figure zone count per page for tuning
    if (import.meta.env.DEV && diagramZones.length > 0) {
      console.debug(
        `[pdfParser] page ${pageNum}: ${diagramZones.length} diagram zone(s) detected → replaced with [Figure]`,
      );
    }

    if (onProgress) {
      onProgress({
        pagesProcessed: pageNum,
        totalPages,
        percent: Math.round((pageNum / totalPages) * 100),
      });
    }

    yield pageText;

    // Release page resources
    page.cleanup();
  }

  pdf.destroy();
}
