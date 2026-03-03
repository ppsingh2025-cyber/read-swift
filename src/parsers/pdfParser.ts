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
    const items = textContent.items.filter((item) => 'str' in item) as Array<{
      str: string;
      hasEOL?: boolean;
    }>;
    let pageText = '';
    for (const item of items) {
      pageText += item.str + ((item.hasEOL ?? false) ? '\n' : ' ');
    }
    pageText = pageText.trim();

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
