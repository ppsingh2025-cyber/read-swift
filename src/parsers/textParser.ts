/**
 * textParser
 *
 * Unified text extraction layer for all supported input formats.
 * Every parser returns the same shape: { words: string[], metadata?: object }
 * so the reading engine never needs to care about the source format.
 *
 * Supported formats:
 *   .txt  – read as plain text
 *   .md   – strip Markdown syntax, preserve readable text
 *   .html – parse DOM and extract text nodes
 *   .rtf  – strip RTF control words, return plain text
 *   .srt  – strip timecode/index lines, keep dialogue
 *   .docx – unzip and extract text from word/document.xml
 */

export interface ParsedText {
  words: string[];
  /** Original text split into lines; used by structureUtils for richer analysis */
  rawLines?: string[];
  metadata?: { title?: string; format: string };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Collapse whitespace and split into non-empty word tokens */
function wordsFromText(raw: string): string[] {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && /\w/.test(w));
}

/** Read a File as UTF-8 text */
function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'utf-8');
  });
}

/** Read a File as an ArrayBuffer */
function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Format parsers ───────────────────────────────────────────────────────────

/** Plain text – trivial passthrough */
async function parseTxt(file: File): Promise<string> {
  return readAsText(file);
}

/**
 * Markdown – strip headings hashes, emphasis markers, links syntax, etc.
 * Preserves the readable text that headings and paragraphs contain.
 * DOMParser is used for the final HTML-tag pass to avoid incomplete regex sanitization.
 */
async function parseMd(file: File): Promise<string> {
  const raw = await readAsText(file);
  const stripped = raw
    // Fenced code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    // ATX headings – keep heading text
    .replace(/^#{1,6}\s+/gm, '')
    // Bold / italic / strikethrough markers
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1')
    // Links: [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Images
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Blockquotes
    .replace(/^>\s*/gm, '')
    // Horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '');
  // Use DOMParser to safely extract text from any remaining HTML in the Markdown
  const doc = new DOMParser().parseFromString(stripped, 'text/html');
  return doc.body?.textContent ?? stripped;
}

/** HTML file – use DOMParser to get textContent */
async function parseHtml(file: File): Promise<string> {
  const raw = await readAsText(file);
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  // Remove script / style nodes before extracting text
  doc.querySelectorAll('script, style, noscript').forEach((el) => el.remove());
  return doc.body?.textContent ?? doc.documentElement.textContent ?? '';
}

/**
 * RTF – strip control words (\word), groups ({...}), and escape sequences.
 * This is a best-effort extraction; complex RTF may lose some structure.
 */
async function parseRtf(file: File): Promise<string> {
  const raw = await readAsText(file);
  return raw
    // Remove escaped unicode \'xx
    .replace(/\\'/g, "'")
    // Remove control words and symbols
    .replace(/\\[a-z*-]+\d*\s?/gi, ' ')
    // Remove group delimiters
    .replace(/[{}]/g, '')
    // Collapse artifacts
    .replace(/\s+/g, ' ');
}

/**
 * SRT subtitles – discard index numbers and timecodes, keep dialogue text.
 * Each subtitle block looks like:
 *   1
 *   00:00:00,000 --> 00:00:02,000
 *   Dialogue line here
 *
 * DOMParser is used for the final HTML-tag pass to avoid incomplete regex sanitization.
 */
async function parseSrt(file: File): Promise<string> {
  const raw = await readAsText(file);
  const stripped = raw
    // Remove timecodes (e.g. "00:00:00,000 --> 00:00:02,000")
    .replace(/^\d{2}:\d{2}:\d{2}[,.:]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.:]\d{3}$/gm, '')
    // Remove sequence numbers (lines that are just a number)
    .replace(/^\d+\s*$/gm, '');
  // Use DOMParser to safely extract text from any HTML tags (e.g. <i>, <b>) in SRT
  const doc = new DOMParser().parseFromString(stripped, 'text/html');
  return doc.body?.textContent ?? stripped;
}

/**
 * DOCX – a DOCX file is a ZIP archive containing word/document.xml.
 * We use JSZip (already a transitive dependency via epubjs) to unzip and
 * then extract paragraph text from the XML.
 */
async function parseDocx(file: File): Promise<string> {
  // Dynamic import keeps this dependency out of the main bundle for non-docx users
  const JSZip = (await import('jszip')).default;
  const arrayBuffer = await readAsArrayBuffer(file);
  const zip = await JSZip.loadAsync(arrayBuffer);

  const xmlFile = zip.file('word/document.xml');
  if (!xmlFile) throw new Error('Invalid DOCX: word/document.xml not found');

  const xmlText = await xmlFile.async('text');
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');

  // Extract text from <w:t> (text run) elements; these hold the actual words
  const nodes = doc.getElementsByTagNameNS(
    'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    't',
  );
  const parts: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    parts.push(nodes[i].textContent ?? '');
  }

  // Paragraph elements <w:p> mark natural breaks; add spacing between them
  const paragraphs = doc.getElementsByTagNameNS(
    'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'p',
  );
  if (paragraphs.length > 0) {
    // Build text paragraph-by-paragraph to preserve sentence boundaries
    const paraTexts: string[] = [];
    for (let i = 0; i < paragraphs.length; i++) {
      const runs = paragraphs[i].getElementsByTagNameNS(
        'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        't',
      );
      let para = '';
      for (let j = 0; j < runs.length; j++) {
        para += runs[j].textContent ?? '';
      }
      if (para.trim()) paraTexts.push(para);
    }
    return paraTexts.join(' ');
  }

  return parts.join(' ');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract words from any supported file type.
 * Returns a { words, metadata } object compatible with the reading engine.
 */
export async function parseFile(file: File): Promise<ParsedText> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  let rawText: string;
  switch (ext) {
    case 'txt':
      rawText = await parseTxt(file);
      break;
    case 'md':
      rawText = await parseMd(file);
      break;
    case 'html':
    case 'htm':
      rawText = await parseHtml(file);
      break;
    case 'rtf':
      rawText = await parseRtf(file);
      break;
    case 'srt':
      rawText = await parseSrt(file);
      break;
    case 'docx':
      rawText = await parseDocx(file);
      break;
    default:
      throw new Error(`Unsupported file format: .${ext}`);
  }

  return {
    words: wordsFromText(rawText),
    rawLines: rawText.split('\n'),
    metadata: { format: ext },
  };
}

/**
 * Normalize a raw text string (e.g. from paste or URL) into the standard
 * { words, metadata } shape used by the reading engine.
 */
export function parseRawText(text: string, source = 'text'): ParsedText {
  return {
    words: wordsFromText(text),
    rawLines: text.split('\n'),
    metadata: { format: source },
  };
}
