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

/** Chunking mode: fixed window vs. intelligent phrase-based grouping */
export type ChunkMode = 'fixed' | 'intelligent';

/** Structural element type for parsed content markers */
export type StructuralType = 'header' | 'subheading' | 'paragraph' | 'scene-separator' | 'dialogue';

/** Metadata attached to a word index indicating a structural boundary */
export interface StructuralMarker {
  type: StructuralType;
  /** Display label for the structural element (e.g. chapter title) */
  label?: string;
}

/** Lightweight session analytics (per-session, stored in localStorage) */
export interface SessionStats {
  /** Total words consumed during the current session */
  wordsRead: number;
  /** Session start time as Unix ms timestamp (0 = not started) */
  startTime: number;
  /** Total active reading time in milliseconds (excludes paused time) */
  activeTimeMs: number;
  /** Effective WPM: wordsRead / (activeTimeMs / 60_000) */
  effectiveWpm: number;
}

interface ReaderState {
  words: string[];
  currentWordIndex: number;
  isPlaying: boolean;
  wpm: number;
  fileMetadata: FileMetadata | null;
  /** Stable identifier for the currently loaded file (filename) */
  fileId: string | null;
  isLoading: boolean;
  loadingProgress: number; // 0–100
  /** Word index where each page/chapter starts (pageBreaks[0] is always 0) */
  pageBreaks: number[];
  /** 1-indexed current page derived from currentWordIndex + pageBreaks */
  currentPage: number;
  /** Total number of pages/chapters (equals pageBreaks.length, 0 when unknown) */
  totalPages: number;
  /** Structural markers keyed by word index for rendering context hints */
  structureMap: Map<number, StructuralMarker>;
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
  /** Font size scale for the ORP (center) word, as a percentage (60–200, default 100) */
  mainWordFontSize: number;
  /** Word grouping strategy: fixed window or intelligent phrase-based chunks */
  chunkMode: ChunkMode;
  /** Lightweight session analytics for the current reading session */
  sessionStats: SessionStats;
  /** Whether to show the focus marker dot beneath the ORP character */
  focusMarkerEnabled: boolean;
  /** Whether to use a fixed-width flex container so the ORP char always lands at the same X position */
  fixedOrpAnchor: boolean;
  /** Whether to apply adaptive per-word pacing on top of existing modifiers */
  adaptiveReadingSpeed: boolean;
  /** Whether to show a subtle vertical focal guide line through the ORP position */
  focalGuideEnabled: boolean;
}

interface ReaderActions {
  setWords: (words: string[]) => void;
  setCurrentWordIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setWpm: (wpm: number) => void;
  setFileMetadata: (meta: FileMetadata | null) => void;
  setFileId: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  resetReader: () => void;
  setPageBreaks: (breaks: number[]) => void;
  /** Set structural markers for the loaded content */
  setStructureMap: (map: Map<number, StructuralMarker>) => void;
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
  setMainWordFontSize: (size: number) => void;
  setChunkMode: (mode: ChunkMode) => void;
  /** Update session analytics (called by the RSVP engine) */
  updateSessionStats: (delta: Partial<SessionStats>) => void;
  /** Reset session analytics (called when a new file is loaded) */
  resetSessionStats: () => void;
  setFocusMarkerEnabled: (enabled: boolean) => void;
  setFixedOrpAnchor: (enabled: boolean) => void;
  setAdaptiveReadingSpeed: (enabled: boolean) => void;
  setFocalGuideEnabled: (enabled: boolean) => void;
}

export type ReaderContextValue = ReaderState & ReaderActions;

export const ReaderContext = createContext<ReaderContextValue | undefined>(undefined);
