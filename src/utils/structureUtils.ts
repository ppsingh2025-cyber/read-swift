/**
 * structureUtils
 *
 * Utilities for detecting structural elements in text content (headers,
 * subheadings, paragraph breaks, scene separators, dialogue blocks, etc.).
 *
 * The output is a Map<wordIndex, StructuralMarker> that can be stored in
 * ReaderContext.structureMap and used by rendering components to display
 * subtle hints at structural boundaries without re-inserting headers.
 *
 * Design goals:
 *  - Works on already-tokenised word arrays (no raw text required).
 *  - Works on the original raw text lines for richer heuristics when available.
 *  - O(n) in word count — safe for 100 k+ word documents.
 */

import type { StructuralMarker, StructuralType } from '../context/readerContextDef';

// ─── Heuristics ──────────────────────────────────────────────────────────────

/** Scene/chapter separator patterns (standalone lines) */
const SEPARATOR_PATTERNS = [
  /^\*{3,}$/,           // ***
  /^-{3,}$/,            // ---
  /^_{3,}$/,            // ___
  /^[•·—–]{3,}$/,       // ———
  /^#{1,3}\s*$/,        // bare hashes
  /^\*\s*\*\s*\*$/,     // * * *
];

/** Chapter / heading indicator patterns */
const HEADER_PATTERNS = [
  /^chapter\s+\d+/i,
  /^part\s+\d+/i,
  /^section\s+\d+/i,
  /^prologue$/i,
  /^epilogue$/i,
  /^introduction$/i,
  /^conclusion$/i,
  /^appendix\b/i,
  /^preface$/i,
  /^foreword$/i,
  /^afterword$/i,
];

/** ATX-style markdown headings */
const MD_HEADING_RE = /^#{1,6}\s+\S/;

/** All-caps line heuristic (min 3 uppercase alpha chars, no lowercase alpha) */
function isAllCapsLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 80) return false;
  const hasLower = /[a-z]/.test(trimmed);
  const hasAlpha = /[A-Z]/.test(trimmed);
  return hasAlpha && !hasLower;
}

function classifyLine(line: string): StructuralType | null {
  const trimmed = line.trim();
  if (!trimmed) return 'paragraph';

  if (SEPARATOR_PATTERNS.some((p) => p.test(trimmed))) return 'scene-separator';
  if (MD_HEADING_RE.test(trimmed)) return 'header';
  if (HEADER_PATTERNS.some((p) => p.test(trimmed))) return 'header';
  if (isAllCapsLine(trimmed)) return 'subheading';
  // Dialogue detection: lines starting with opening quotes
  if (/^["'"']/.test(trimmed)) return 'dialogue';

  return null;
}

// ─── Line-based analysis ─────────────────────────────────────────────────────

export interface LineStructureResult {
  structureMap: Map<number, StructuralMarker>;
}

/**
 * Analyse raw text split into lines, building a map from word indices to
 * structural markers. `words` is the already-tokenised flat word array; the
 * raw lines are used only for heuristic detection.
 *
 * @param rawLines - Original text split by newlines (not tokenised)
 * @param words    - The already-tokenised word array (same content as rawLines)
 */
export function buildStructureMap(
  rawLines: string[],
  words: string[],
): Map<number, StructuralMarker> {
  const map = new Map<number, StructuralMarker>();

  // Build a word-index cursor that advances as we consume tokens from each line
  let wordCursor = 0;

  for (const line of rawLines) {
    // Count how many words this line contributes when tokenised
    const lineWords = line
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0 && /\w/.test(w));

    const type = classifyLine(line);

    if (type && wordCursor < words.length) {
      const label = type !== 'paragraph' && type !== 'dialogue'
        ? line.replace(/^#+\s*/, '').trim()
        : undefined;
      const marker: StructuralMarker = { type, ...(label ? { label } : {}) };
      map.set(wordCursor, marker);
    }

    wordCursor += lineWords.length;
  }

  return map;
}

/**
 * Lightweight version that operates directly on the word array without raw
 * lines. Uses word-level heuristics to detect structural elements.
 * Less accurate than buildStructureMap but works when raw lines are unavailable.
 */
export function buildStructureMapFromWords(
  words: string[],
): Map<number, StructuralMarker> {
  const map = new Map<number, StructuralMarker>();

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Scene separator (a single separator token)
    if (SEPARATOR_PATTERNS.some((p) => p.test(word))) {
      map.set(i, { type: 'scene-separator' });
      continue;
    }

    // Detect chapter-header sequences: "Chapter" followed by a number/word
    if (/^(Chapter|Part|Section|Episode)$/i.test(word) && i + 1 < words.length) {
      map.set(i, { type: 'header', label: `${word} ${words[i + 1]}` });
      continue;
    }
  }

  return map;
}
