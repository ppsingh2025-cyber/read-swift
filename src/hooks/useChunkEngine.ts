/**
 * useChunkEngine
 *
 * Optional phrase-based chunking layer for the RSVP engine.
 *
 * When chunkMode === 'fixed', this hook returns the same word window that
 * the existing useRSVPEngine already produces (passthrough).
 *
 * When chunkMode === 'intelligent', the hook pre-builds a phrase-chunk index
 * from the full word array, then maps the current word index to the phrase
 * chunk that contains it. The word window displayed is the phrase chunk,
 * padded to windowSize if shorter.
 *
 * Phrase chunking rules:
 *  1. A phrase ends after a comma, semicolon, colon, or conjunction.
 *  2. A phrase ends before a preposition if the preceding segment is ≥ 2 words.
 *  3. Maximum phrase length = windowSize * 2 (so the display never exceeds safe width).
 *  4. Minimum phrase length = 1 (single words are valid chunks).
 *
 * ORP guarantee: the center/highlight slot of the word window is always the
 * first word of the chunk so the eye has a consistent anchor point.
 *
 * Performance: the chunk index is rebuilt only when words or windowSize change,
 * not on every render or every word advance. For a 100 k-word document this
 * takes < 10 ms.
 */

import { useMemo } from 'react';
import type { ChunkMode } from '../context/readerContextDef';

/** Common English conjunctions and prepositions that mark phrase boundaries */
const CONJUNCTIONS = new Set([
  'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
  'although', 'because', 'since', 'unless', 'until', 'while',
  'if', 'though', 'whereas', 'after', 'before', 'once',
]);

const PREPOSITIONS = new Set([
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'into', 'onto', 'upon', 'about', 'above', 'below', 'between',
  'through', 'during', 'within', 'without', 'across', 'behind',
  'under', 'over', 'after', 'before', 'toward', 'towards',
]);

/**
 * Returns true if a word ends with a phrase-terminating punctuation mark.
 * Punctuation following letters (e.g. "end," or "end.") signals a break.
 */
function endsPhrase(word: string): boolean {
  return /[,;:]$/.test(word);
}

/**
 * Build an array of phrase chunks from the word array.
 * Each chunk is an array of word indices (into `words`).
 * Returns both the chunks array and a reverse map: wordIndex → chunkIndex.
 */
export function buildPhraseChunks(
  words: string[],
  maxChunkSize: number,
): { chunks: number[][]; wordToChunk: Int32Array } {
  const chunks: number[][] = [];
  const wordToChunk = new Int32Array(words.length).fill(-1);

  let chunkStart = 0;

  while (chunkStart < words.length) {
    let len = 1;
    const maxLen = Math.min(maxChunkSize, words.length - chunkStart);

    while (len < maxLen) {
      const word = words[chunkStart + len - 1];
      const nextWord = words[chunkStart + len]?.toLowerCase() ?? '';

      // End chunk after terminal punctuation
      if (endsPhrase(word)) break;

      // End chunk before a conjunction (new clause starts)
      if (len >= 2 && CONJUNCTIONS.has(nextWord)) break;

      // End chunk before a preposition (if current segment ≥ 2 words)
      if (len >= 2 && PREPOSITIONS.has(nextWord)) break;

      len++;
    }

    const chunk: number[] = [];
    for (let i = 0; i < len; i++) {
      const wi = chunkStart + i;
      chunk.push(wi);
      wordToChunk[wi] = chunks.length;
    }
    chunks.push(chunk);
    chunkStart += len;
  }

  return { chunks, wordToChunk };
}

interface ChunkEngineResult {
  /** The word window to display (may be a phrase chunk padded to windowSize) */
  chunkWindow: string[];
  /** Index within chunkWindow that should be highlighted (always 0 for chunks) */
  chunkHighlightIndex: number;
}

/**
 * Given the current reading state, return the display window for the
 * current position. This hook is a pure transform — it does not drive
 * playback. It is consumed by the rendering layer only.
 *
 * @param words          - Full word array
 * @param currentWordIndex - Global word index pointer
 * @param windowSize     - Maximum slots in the display window
 * @param chunkMode      - 'fixed' passthrough | 'intelligent' phrase grouping
 * @param fixedWindow    - The word window already computed by useRSVPEngine
 * @param fixedHighlight - The highlight index from useRSVPEngine
 */
export function useChunkEngine(
  words: string[],
  currentWordIndex: number,
  windowSize: number,
  chunkMode: ChunkMode,
  fixedWindow: string[],
  fixedHighlight: number,
): ChunkEngineResult {
  // Build phrase chunk index when in intelligent mode
  const phraseData = useMemo(() => {
    if (chunkMode !== 'intelligent' || words.length === 0) return null;
    return buildPhraseChunks(words, windowSize * 2);
  }, [words, windowSize, chunkMode]);

  const chunkWindow = useMemo<string[]>(() => {
    if (chunkMode !== 'intelligent' || !phraseData) return fixedWindow;

    const { chunks, wordToChunk } = phraseData;
    const chunkIdx = wordToChunk[currentWordIndex] ?? -1;
    if (chunkIdx < 0 || chunkIdx >= chunks.length) return fixedWindow;

    const chunk = chunks[chunkIdx];
    // Build the window from the chunk words, padded with empty slots if shorter
    const result: string[] = chunk.map((wi) => words[wi] ?? '');
    // Pad to at most windowSize (do not truncate — phrases may exceed windowSize)
    while (result.length < windowSize) result.push('');
    return result;
  }, [chunkMode, phraseData, currentWordIndex, words, fixedWindow, windowSize]);

  // In intelligent mode, the ORP is always at index 0 (first word of phrase)
  const chunkHighlightIndex = chunkMode === 'intelligent' ? 0 : fixedHighlight;

  return { chunkWindow, chunkHighlightIndex };
}
