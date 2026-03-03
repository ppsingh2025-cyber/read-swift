/**
 * readerContextDef
 *
 * Defines the ReaderContext types and creates the context object.
 * Kept in a non-component file so that ReaderContext.tsx can export only
 * the ReaderProvider component (required by react-refresh).
 */

import { createContext } from 'react';

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

export interface ReadingRecord {
  name: string;
  wordCount: number;
  lastWordIndex: number;
  lastReadAt: string; // ISO date string
  wpm: number;
}

/** Number of words displayed simultaneously in the rolling window */
export type WindowSize = 1 | 2 | 3 | 4 | 5;

/** Display orientation of the word window */
export type Orientation = 'horizontal' | 'vertical';

/** App colour theme */
export type Theme = 'day' | 'night';

interface ReaderState {
  words: string[];
  currentWordIndex: number;
  isPlaying: boolean;
  wpm: number;
  fileMetadata: FileMetadata | null;
  isLoading: boolean;
  loadingProgress: number; // 0–100
  /** Word index where each page/chapter starts (pageBreaks[0] is always 0) */
  pageBreaks: number[];
  /** 1-indexed current page derived from currentWordIndex + pageBreaks */
  currentPage: number;
  /** Total number of pages/chapters (equals pageBreaks.length, 0 when unknown) */
  totalPages: number;
  records: ReadingRecord[];
  /** Number of words shown at once in the rolling window (1–5) */
  windowSize: WindowSize;
  /** CSS color string for the highlighted (center) word */
  highlightColor: string;
  /** Layout direction of the rolling word window */
  orientation: Orientation;
  /** UI colour theme */
  theme: Theme;
  /** Whether to use Optimal Recognition Point (ORP) highlighting */
  orpEnabled: boolean;
  /** Whether to add extra pause after punctuation */
  punctuationPause: boolean;
  /** Whether to dim peripheral (non-center) words to sharpen focal contrast */
  peripheralFade: boolean;
  /** Whether to apply extra delay for long words (>8 chars) */
  longWordCompensation: boolean;
}

interface ReaderActions {
  setWords: (words: string[]) => void;
  setCurrentWordIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setWpm: (wpm: number) => void;
  setFileMetadata: (meta: FileMetadata | null) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  resetReader: () => void;
  setPageBreaks: (breaks: number[]) => void;
  goToPage: (page: number) => void;
  /** Jump to a specific 0-indexed word and pause playback */
  goToWord: (index: number) => void;
  setRecords: (records: ReadingRecord[]) => void;
  setWindowSize: (size: WindowSize) => void;
  setHighlightColor: (color: string) => void;
  setOrientation: (orientation: Orientation) => void;
  setTheme: (theme: Theme) => void;
  setOrpEnabled: (enabled: boolean) => void;
  setPunctuationPause: (enabled: boolean) => void;
  setPeripheralFade: (enabled: boolean) => void;
  setLongWordCompensation: (enabled: boolean) => void;
}

export type ReaderContextValue = ReaderState & ReaderActions;

export const ReaderContext = createContext<ReaderContextValue | undefined>(undefined);
