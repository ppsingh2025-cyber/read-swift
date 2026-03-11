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
 * Diagram detection (Approach C — two-pass spatial analysis):
 *
 *   Each pdfjs-dist TextItem carries a full affine transform:
 *     transform[4] = x   (left edge of glyph, in PDF user units)
 *     transform[5] = y   (baseline from page bottom, y=0 at bottom)
 *
 *   Pass 1 — Anchor band detection:
 *     Items are grouped into horizontal y-bands (tolerance Y_BAND_TOLERANCE).
 *     A band qualifies as a diagram ANCHOR if ALL four guards pass:
 *       a. x-positions are widely scattered (xStdDev > X_SPREAD_MIN = 75)
 *       b. The band contains at least one genuine diagram symbol, per
 *          isDiagramSymbol() — non-ASCII chars that are NOT prose typography.
 *       c. The band is NOT a repeated-symbol separator (£ £ £, • • •).
 *       d. The band is NOT a table column header (all single uppercase letters).
 *
 *   Pass 2 — Zone building and expansion:
 *     Anchor bands within ZONE_MERGE_GAP (20pt) are merged into anchor zones.
 *     Each anchor zone is expanded outward by ±ZONE_EXPAND_GAP (40pt) to
 *     capture text labels adjacent to the diagram (e.g. "Your Thinking",
 *     "Buy the Book") whose own bands did not qualify as anchors.
 *
 *   Pass 3 — Item filtering:
 *     Items within any expanded zone are excluded. A single '\n[Figure]\n'
 *     placeholder is emitted per contiguous filtered run.
 *
 *   Characters that DO qualify as diagram symbols (isDiagramSymbol = true):
 *     «  »  (U+00AB/BB — guillemets used as arrows in DADA diagrams)
 *     ®  (U+00AE — registered sign used as visual node in Endgame diagrams)
 *     ¢  £  ¥  (U+00A2/A3/A5 — currency signs used as node markers)
 *     →  ←  ↑  ↓  (U+2190–21FF — actual Unicode arrow characters)
 *     All other non-ASCII chars not explicitly excluded below
 *
 *   Characters excluded from diagram detection (isDiagramSymbol = false):
 *     '  '  "  "  etc.  (U+2018–201F — typographic quotes and apostrophes)
 *     –  —  (U+2013/14 — en/em dash)
 *     …  (U+2026 — ellipsis)
 *     é  ñ  ü  etc.  (U+00C0–00FF selective — Latin letters with diacritics)
 *     ©  (U+00A9)  °  (U+00B0)  §  (U+00A7)  ¹²³  (U+00B9/B2/B3)
 *     º  (U+00BA)  ¼ ½ ¾  (U+00BC–BE)  non-breaking space  (U+00A0)
 *     — all common footnote markers and ordinals found in prose text
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
 * the same visual line. At 10–12pt body font, within-line y-variation from
 * pdfjs is typically 0–2pt. 3pt provides a safe margin without merging
 * adjacent lines (~14pt apart).
 */
const Y_BAND_TOLERANCE = 3;

/**
 * Minimum standard deviation of x-positions for a band to be considered
 * spatially scattered. Diagram labels scattered across a page have xStdDev
 * of 80–130pt. Body text columns have xStdDev of 20–50pt. Wide inline
 * quotes may reach 65pt. 75pt is the validated lower bound that separates
 * genuine diagram bands from the widest prose layouts.
 *
 * [Changed v2→v3: 60 → 75, based on real-PDF audit of 256 pages]
 */
const X_SPREAD_MIN = 75;

/**
 * Anchor bands whose representative y-values are within this many PDF user
 * units of each other are merged into a single anchor zone. 20pt ≈ 1.4 line
 * heights — enough to merge items on adjacent rows of the same figure without
 * bridging across a blank-line separator between figure and prose.
 */
const ZONE_MERGE_GAP = 20;

/**
 * After merging, each anchor zone is expanded outward by this many PDF user
 * units in both directions to capture text labels adjacent to the diagram.
 * 40pt ≈ 2.8 line heights — absorbs one label row above and below the anchor.
 *
 * Known limitation: two separate diagram anchor zones that are 21–86pt apart
 * on the same page will have their expansions bleed into each other, swallowing
 * intervening prose. This is acceptable for typical book layouts where diagrams
 * are separated by many lines or placed on different pages.
 *
 * [Changed v2→v3: 30 → 40, fixes label leak where labels sat 42pt from anchor]
 */
const ZONE_EXPAND_GAP = 40;

/**
 * Minimum number of items in a band before anchor detection is attempted.
 * A band with only 1 item cannot exhibit meaningful x-spread.
 */
const MIN_BAND_ITEMS = 2;

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * The subset of pdfjs-dist TextItem properties needed for spatial analysis.
 * pdfjs-dist 5.x TextItem shape:
 *   str: string            — the extracted text
 *   hasEOL: boolean        — true when this item ends a visual line
 *   transform: number[]    — [a, b, c, d, x, y] affine matrix
 *   width: number          — rendered width in user units
 *   height: number         — rendered height in user units
 *   fontName: string       — internal font identifier
 */
interface SpatialTextItem {
  str: string;
  hasEOL?: boolean;
  transform: number[]; // transform[4] = x, transform[5] = y
  width: number;
  height: number;
}

export interface ParseProgress {
  pagesProcessed: number;
  totalPages: number;
  /** 0–100 */
  percent: number;
}

// ─── Diagram symbol classification ───────────────────────────────────────────

/**
 * Returns true if a single character qualifies as a diagram symbol.
 *
 * A diagram symbol is any non-ASCII character that is NOT a common prose
 * typography character. Prose typography characters are excluded because they
 * appear thousands of times in normal body text and would cause every prose
 * page to falsely trigger diagram detection.
 *
 * EXCLUDED (return false — these are prose, not diagrams):
 *   U+00A0          Non-breaking space
 *   U+00A7  §       Section sign (footnote marker in legal/academic texts)
 *   U+00A9  ©       Copyright sign (inline footnote marker)
 *   U+00B0  °       Degree sign / ordinal superscript
 *   U+00B1  ±       Plus-minus sign (math/science prose)
 *   U+00B2  ²       Superscript 2 (common footnote number)
 *   U+00B3  ³       Superscript 3 (common footnote number)
 *   U+00B9  ¹       Superscript 1 (very common footnote number)
 *   U+00BA  º       Masculine ordinal indicator
 *   U+00BC–BE ¼½¾   Vulgar fractions
 *   U+00C0–D6       Latin capital letters with diacritics (À Á Â … Ö)
 *   U+00D8–F6       Latin letters with diacritics (Ø Ù … ö)
 *   U+00F8–FF       Latin letters with diacritics (ø ù … ÿ)
 *   U+2013  –       En dash
 *   U+2014  —       Em dash
 *   U+2018–201F     Curly/smart quotation marks (', ', ", " and variants)
 *   U+2026  …       Horizontal ellipsis
 *
 * INCLUDED (return true — these are treated as potential diagram symbols):
 *   U+00AB  «       Left-pointing guillemet (used as arrow in DADA diagrams)
 *   U+00BB  »       Right-pointing guillemet (used as arrow in DADA diagrams)
 *   U+00A2  ¢       Cent sign (diagram node marker)
 *   U+00A3  £       Pound sign (diagram node marker)
 *   U+00A5  ¥       Yen sign (diagram node marker)
 *   U+00AE  ®       Registered sign (diagram node marker)
 *   U+2190–21FF     Unicode arrows (→ ← ↑ ↓ etc.)
 *   U+25xx          Geometric shapes (■ □ ● ○ etc.)
 *   All other non-ASCII not in the exclusion list above
 */
export function isDiagramSymbol(ch: string): boolean {
  if (ch.length === 0) return false;
  const cp = ch.charCodeAt(0);
  if (cp <= 127) return false;
  // Non-breaking space
  if (cp === 0x00A0) return false;
  // Common footnote/ordinal markers in prose
  if (cp === 0x00A7) return false; // §
  if (cp === 0x00A9) return false; // ©
  if (cp === 0x00B0) return false; // °
  if (cp === 0x00B1) return false; // ±
  if (cp === 0x00B2) return false; // ²
  if (cp === 0x00B3) return false; // ³
  if (cp === 0x00B9) return false; // ¹
  if (cp === 0x00BA) return false; // º
  if (cp >= 0x00BC && cp <= 0x00BE) return false; // ¼ ½ ¾
  // Latin letters with diacritics (accented prose text)
  if (cp >= 0x00C0 && cp <= 0x00D6) return false;
  if (cp >= 0x00D8 && cp <= 0x00F6) return false;
  if (cp >= 0x00F8 && cp <= 0x00FF) return false;
  // Typographic prose punctuation
  if (cp >= 0x2013 && cp <= 0x2014) return false; // – —
  if (cp >= 0x2018 && cp <= 0x201F) return false; // curly quotes
  if (cp === 0x2026) return false; // …
  return true;
}

/**
 * Returns true if any item in the band contains at least one character that
 * qualifies as a diagram symbol per isDiagramSymbol().
 */
function hasDiagramSymbolToken(band: SpatialTextItem[]): boolean {
  return band.some((item) => item.str.split('').some(isDiagramSymbol));
}

/**
 * Returns true when every non-empty item in the band is the same single
 * diagram-qualifying character — the pattern of typographic separators
 * such as £ £ £, • • •.
 *
 * A genuine diagram band always has mixed tokens (e.g. Enemy £ Enemy £ us,),
 * so this guard never fires on real diagrams.
 */
function isRepeatedSymbolSeparator(band: SpatialTextItem[]): boolean {
  const tokens = band.map((i) => i.str.trim()).filter((t) => t.length > 0);
  if (tokens.length === 0) return false;
  const first = tokens[0];
  // Must be a single diagram-qualifying character repeated across all items
  if (first.length !== 1 || !isDiagramSymbol(first)) return false;
  return tokens.every((t) => t === first);
}

/**
 * Returns true when a band qualifies as a diagram ANCHOR — spatially scattered
 * items containing a genuine diagram symbol, passing all four guards:
 *
 *   1. MIN_BAND_ITEMS: at least 2 items to measure spread
 *   2. xStdDev > X_SPREAD_MIN (75): items are widely distributed horizontally
 *   3. hasDiagramSymbolToken: at least one genuine diagram symbol present
 *   4. NOT isRepeatedSymbolSeparator: not a single-char separator row (£ £ £)
 *   5. NOT all single uppercase letters: not a table column header (A B C D)
 */
function isDiagramAnchorBand(band: SpatialTextItem[]): boolean {
  if (band.length < MIN_BAND_ITEMS) return false;

  // Guard 1: x-spread
  const xs = band.map((i) => i.transform[4]);
  const xMean = xs.reduce((s, x) => s + x, 0) / xs.length;
  const xStdDev = Math.sqrt(xs.reduce((s, x) => s + (x - xMean) ** 2, 0) / xs.length);
  if (xStdDev < X_SPREAD_MIN) return false;

  // Guard 2: genuine diagram symbol required
  if (!hasDiagramSymbolToken(band)) return false;

  // Guard 3: not a repeated separator (£ £ £, • • •)
  if (isRepeatedSymbolSeparator(band)) return false;

  // Guard 4: not a table column header (A B C D)
  if (band.every((i) => /^[A-Z]$/.test(i.str.trim()))) return false;

  return true;
}

/**
 * Analyses all text items on a single PDF page and returns expanded zone
 * ranges [yMin, yMax] representing detected diagram regions.
 *
 * Two-pass algorithm:
 *   Pass 1: Sort items by y DESC. Group into y-bands (Y_BAND_TOLERANCE=3pt).
 *           Collect avg-y of each band that passes isDiagramAnchorBand().
 *   Pass 2a: Merge anchor y-values within ZONE_MERGE_GAP (20pt) into zones.
 *   Pass 2b: Expand each zone by ±(Y_BAND_TOLERANCE + ZONE_EXPAND_GAP) = ±43pt.
 */
function detectDiagramZones(items: SpatialTextItem[]): Array<[number, number]> {
  if (items.length < MIN_BAND_ITEMS * 2) return [];

  // ── Pass 1: group into y-bands sorted top-of-page first (y DESC in PDF) ──
  const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5]);

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

  // Collect representative y (band average) for each anchor band
  const anchorYs: number[] = [];
  for (const band of bands) {
    if (isDiagramAnchorBand(band)) {
      const avgY = band.reduce((s, i) => s + i.transform[5], 0) / band.length;
      anchorYs.push(avgY);
    }
  }

  if (anchorYs.length === 0) return [];

  // ── Pass 2a: merge anchor y-values into anchor zones ──────────────────────
  // anchorYs is in descending order (top of page first)
  const anchorZones: Array<[number, number]> = [];
  let zoneTop = anchorYs[0];
  let zoneBottom = anchorYs[0];

  for (let i = 1; i < anchorYs.length; i++) {
    const gap = zoneBottom - anchorYs[i]; // positive = next band is below current bottom
    if (gap <= ZONE_MERGE_GAP) {
      zoneBottom = anchorYs[i]; // extend zone downward
    } else {
      anchorZones.push([zoneBottom, zoneTop]);
      zoneTop = anchorYs[i];
      zoneBottom = anchorYs[i];
    }
  }
  anchorZones.push([zoneBottom, zoneTop]);

  // ── Pass 2b: expand each anchor zone ─────────────────────────────────────
  const expandedZones: Array<[number, number]> = anchorZones.map(([yMin, yMax]) => [
    yMin - Y_BAND_TOLERANCE - ZONE_EXPAND_GAP,
    yMax + Y_BAND_TOLERANCE + ZONE_EXPAND_GAP,
  ]);

  return expandedZones;
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
    // '\n' at EOL boundaries gives the content normalizer the line structure it
    // needs for header/footer classification (Stage 3 of the ingestion pipeline).
    // Non-EOL items are joined with a space.
    //
    // Spatial diagram detection (two-pass):
    //   Full SpatialTextItem shape is read for each item. detectDiagramZones()
    //   returns expanded zone ranges [yMin, yMax] for this page. Items within
    //   a zone are replaced with a single '[Figure]' placeholder per run.
    const items = textContent.items.filter((item) => 'str' in item) as SpatialTextItem[];

    const diagramZones = detectDiagramZones(items);

    let pageText = '';
    let lastWasFigurePlaceholder = false;

    for (const item of items) {
      const itemY = item.transform[5];
      const inDiagramZone = diagramZones.some(
        ([yMin, yMax]) => itemY >= yMin && itemY <= yMax,
      );

      if (inDiagramZone) {
        if (!lastWasFigurePlaceholder) {
          pageText += '\n[Figure]\n';
          lastWasFigurePlaceholder = true;
        }
        // Diagram items are discarded — do not append item.str
      } else {
        lastWasFigurePlaceholder = false;
        pageText += item.str + ((item.hasEOL ?? false) ? '\n' : ' ');
      }
    }

    pageText = pageText.trim();

    // DEV-mode logging: report zone count per page for threshold tuning
    if (import.meta.env.DEV && diagramZones.length > 0) {
      console.debug(
        `[pdfParser] page ${pageNum}: ${diagramZones.length} diagram zone(s) → [Figure]`,
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
