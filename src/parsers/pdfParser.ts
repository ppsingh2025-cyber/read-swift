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
 * Diagram detection (token-level filtering):
 *   Each pdfjs-dist TextItem has a str field. Items whose trimmed text is ≤2
 *   characters and matches only letter or arrow characters are classified as
 *   diagram label tokens (e.g. "D", "A", "→"). These are silently discarded
 *   and collapsed into a single "\n[Figure]\n" placeholder per contiguous run.
 *   All other tokens (prose words, headings, captions, table text) are emitted
 *   unchanged. This prevents garbled diagram labels from entering the RSVP word
 *   array while ensuring that paragraphs and headings directly adjacent to a
 *   diagram are never deleted.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Point the worker at the bundled worker file (Vite handles the URL via ?url)
// Use legacy build to avoid ESM worker issues in some browsers
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href;

export interface ParseProgress {
  pagesProcessed: number;
  totalPages: number;
  /** 0–100 */
  percent: number;
}

/**
 * Returns true when a text item looks like a diagram label token rather than a
 * prose word. Diagram labels are:
 *   - ≤2 characters when trimmed
 *   - composed entirely of ASCII letters or arrow/connector symbols
 *
 * Examples that match: "D", "A", "→", "←", "↑", "↓", "-", "–"
 * Examples that do NOT match: "Positive", "Sum", "Game", "acting", "3.2", "•"
 *
 * The empty-string case is excluded by the regex requiring ≥1 character (+).
 */
function isDiagramToken(text: string): boolean {
  const t = text.trim();
  return t.length <= 2 && /^[A-Za-z→←↑↓↔\-–]+$/.test(t);
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
    // Diagram label filtering: items whose trimmed text matches isDiagramToken()
    // are silently dropped. Contiguous runs of diagram tokens collapse to a
    // single '\n[Figure]\n' placeholder. Prose items are never discarded.
    const items = textContent.items.filter((item) => 'str' in item) as Array<{
      str: string;
      hasEOL?: boolean;
    }>;

    let pageText = '';
    let lastWasFigurePlaceholder = false;
    let hadDiagramTokens = false;

    for (const item of items) {
      const text = item.str.trim();

      if (isDiagramToken(text)) {
        // Emit at most one [Figure] per contiguous run of diagram tokens.
        // Multiple diagram label items in a row collapse to a single placeholder.
        if (!lastWasFigurePlaceholder) {
          pageText += '\n[Figure]\n';
          lastWasFigurePlaceholder = true;
          hadDiagramTokens = true;
        }
        // Diagram label is otherwise discarded — do not append item.str
      } else {
        lastWasFigurePlaceholder = false;
        pageText += item.str + ((item.hasEOL ?? false) ? '\n' : ' ');
      }
    }

    pageText = pageText.trim();

    // DEV-mode logging: report when diagram tokens were found on this page
    if (import.meta.env.DEV && hadDiagramTokens) {
      console.debug(
        `[pdfParser] page ${pageNum}: diagram label token(s) detected → replaced with [Figure]`,
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
