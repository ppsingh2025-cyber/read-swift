/**
 * ReaderContext
 *
 * Central state store for the RSVP reader. Provides words array, playback
 * state, speed (WPM), file metadata, and loading progress to all components.
 * Word index is also persisted in localStorage so the user can resume reading.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ReaderContext, type FileMetadata, type ReadingRecord, type WindowSize, type Orientation, type Theme, type ChunkMode, type SessionStats, type StructuralMarker } from './readerContextDef';
import { loadRecords } from '../utils/recordsUtils';

const LS_KEY_INDEX = 'fastread_word_index';
const LS_KEY_WPM = 'fastread_wpm';
const LS_KEY_WINDOW_SIZE = 'fastread_window_size';
const LS_KEY_HIGHLIGHT_COLOR = 'fastread_highlight_color';
const LS_KEY_ORIENTATION = 'fastread_orientation';
const LS_KEY_THEME = 'fastread_theme';
const LS_KEY_ORP = 'fastread_orp';
const LS_KEY_PUNCT_PAUSE = 'fastread_punct_pause';
const LS_KEY_PERIPHERAL_FADE = 'fastread_peripheral_fade';
const LS_KEY_LONG_WORD_COMP = 'fastread_long_word_comp';
const LS_KEY_MAIN_FONT_SIZE = 'fastread_main_font_size';
const LS_KEY_CHUNK_MODE = 'fastread_chunk_mode';
const LS_KEY_SESSION_STATS = 'fastread_session_stats';
const DEFAULT_WPM = 250;
const DEFAULT_WINDOW_SIZE: WindowSize = 1;
const DEFAULT_HIGHLIGHT_COLOR = '#ff0000';
const DEFAULT_ORIENTATION: Orientation = 'horizontal';
const DEFAULT_THEME: Theme = 'night';
const DEFAULT_ORP = false;
const DEFAULT_PUNCT_PAUSE = true;
const DEFAULT_PERIPHERAL_FADE = false;
const DEFAULT_LONG_WORD_COMP = true;
const DEFAULT_MAIN_FONT_SIZE = 100;
const DEFAULT_CHUNK_MODE: ChunkMode = 'fixed';

const EMPTY_SESSION_STATS: SessionStats = {
  wordsRead: 0,
  startTime: 0,
  activeTimeMs: 0,
  effectiveWpm: 0,
};

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [words, setWordsState] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndexState] = useState<number>(() => {
    const saved = localStorage.getItem(LS_KEY_INDEX);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpmState] = useState<number>(() => {
    const saved = localStorage.getItem(LS_KEY_WPM);
    return saved ? parseInt(saved, 10) : DEFAULT_WPM;
  });
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [pageBreaks, setPageBreaksState] = useState<number[]>([]);
  const [structureMap, setStructureMapState] = useState<Map<number, StructuralMarker>>(() => new Map());
  const [records, setRecordsState] = useState<ReadingRecord[]>(() => loadRecords());
  const [windowSize, setWindowSizeState] = useState<WindowSize>(() => {
    const saved = localStorage.getItem(LS_KEY_WINDOW_SIZE);
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_WINDOW_SIZE;
    return ([1, 2, 3, 4, 5].includes(parsed) ? parsed : DEFAULT_WINDOW_SIZE) as WindowSize;
  });
  const [highlightColor, setHighlightColorState] = useState<string>(() => {
    return localStorage.getItem(LS_KEY_HIGHLIGHT_COLOR) ?? DEFAULT_HIGHLIGHT_COLOR;
  });
  const [orientation, setOrientationState] = useState<Orientation>(() => {
    const saved = localStorage.getItem(LS_KEY_ORIENTATION);
    if (saved === 'vertical' || saved === 'horizontal') return saved as Orientation;
    // No saved preference yet — derive from screen width once and persist it
    // immediately so all subsequent visits (on any device/screen size) retain
    // this initial choice rather than recomputing the adaptive default.
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const initial: Orientation = isMobile ? 'vertical' : DEFAULT_ORIENTATION;
    try { localStorage.setItem(LS_KEY_ORIENTATION, initial); } catch { /* storage unavailable */ }
    return initial;
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(LS_KEY_THEME);
    return (saved === 'day' ? 'day' : DEFAULT_THEME) as Theme;
  });
  const [orpEnabled, setOrpEnabledState] = useState<boolean>(() => {
    return localStorage.getItem(LS_KEY_ORP) === 'true' ? true : DEFAULT_ORP;
  });
  const [punctuationPause, setPunctuationPauseState] = useState<boolean>(() => {
    const saved = localStorage.getItem(LS_KEY_PUNCT_PAUSE);
    return saved === null ? DEFAULT_PUNCT_PAUSE : saved === 'true';
  });
  const [peripheralFade, setPeripheralFadeState] = useState<boolean>(() => {
    const saved = localStorage.getItem(LS_KEY_PERIPHERAL_FADE);
    return saved === null ? DEFAULT_PERIPHERAL_FADE : saved === 'true';
  });
  const [longWordCompensation, setLongWordCompensationState] = useState<boolean>(() => {
    const saved = localStorage.getItem(LS_KEY_LONG_WORD_COMP);
    return saved === null ? DEFAULT_LONG_WORD_COMP : saved === 'true';
  });
  const [mainWordFontSize, setMainWordFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem(LS_KEY_MAIN_FONT_SIZE);
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_MAIN_FONT_SIZE;
    return isNaN(parsed) ? DEFAULT_MAIN_FONT_SIZE : Math.min(200, Math.max(60, parsed));
  });
  const [chunkMode, setChunkModeState] = useState<ChunkMode>(() => {
    const saved = localStorage.getItem(LS_KEY_CHUNK_MODE);
    return (saved === 'intelligent' || saved === 'fixed') ? saved as ChunkMode : DEFAULT_CHUNK_MODE;
  });
  const [sessionStats, setSessionStatsState] = useState<SessionStats>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY_SESSION_STATS);
      if (saved) return JSON.parse(saved) as SessionStats;
    } catch { /* ignore parse errors */ }
    return { ...EMPTY_SESSION_STATS };
  });

  // Derive 1-indexed current page via binary search over pageBreaks
  const currentPage = useMemo(() => {
    if (pageBreaks.length === 0) return 1;
    let lo = 0;
    let hi = pageBreaks.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (pageBreaks[mid] <= currentWordIndex) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  }, [pageBreaks, currentWordIndex]);

  const totalPages = pageBreaks.length;

  // Persist word index to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LS_KEY_INDEX, String(currentWordIndex));
  }, [currentWordIndex]);

  // Persist WPM
  useEffect(() => {
    localStorage.setItem(LS_KEY_WPM, String(wpm));
  }, [wpm]);

  const setWords = useCallback((newWords: string[]) => {
    setWordsState(newWords);
    // Reset index and page breaks when a new file is loaded
    setCurrentWordIndexState(0);
    setPageBreaksState([]);
    setStructureMapState(new Map());
    localStorage.setItem(LS_KEY_INDEX, '0');
  }, []);

  const setCurrentWordIndex = useCallback((index: number) => {
    setCurrentWordIndexState(index);
  }, []);

  const setWpm = useCallback((newWpm: number) => {
    setWpmState(newWpm);
  }, []);

  const resetReader = useCallback(() => {
    setCurrentWordIndexState(0);
    setIsPlaying(false);
    localStorage.setItem(LS_KEY_INDEX, '0');
  }, []);

  const setPageBreaks = useCallback((breaks: number[]) => {
    setPageBreaksState(breaks);
  }, []);

  const setStructureMap = useCallback((map: Map<number, StructuralMarker>) => {
    setStructureMapState(map);
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      if (pageBreaks.length === 0) return;
      const clamped = Math.max(1, Math.min(page, pageBreaks.length));
      const wordIndex = pageBreaks[clamped - 1];
      setCurrentWordIndexState(wordIndex);
      setIsPlaying(false);
      localStorage.setItem(LS_KEY_INDEX, String(wordIndex));
    },
    [pageBreaks],
  );

  const goToWord = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, words.length - 1));
      setCurrentWordIndexState(clamped);
      setIsPlaying(false);
      localStorage.setItem(LS_KEY_INDEX, String(clamped));
    },
    [words.length],
  );

  const setRecords = useCallback((newRecords: ReadingRecord[]) => {
    setRecordsState(newRecords);
  }, []);

  const setWindowSize = useCallback((size: WindowSize) => {
    setWindowSizeState(size);
    localStorage.setItem(LS_KEY_WINDOW_SIZE, String(size));
  }, []);

  const setHighlightColor = useCallback((color: string) => {
    setHighlightColorState(color);
    localStorage.setItem(LS_KEY_HIGHLIGHT_COLOR, color);
  }, []);

  const setOrientation = useCallback((o: Orientation) => {
    setOrientationState(o);
    localStorage.setItem(LS_KEY_ORIENTATION, o);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(LS_KEY_THEME, t);
  }, []);

  const setOrpEnabled = useCallback((enabled: boolean) => {
    setOrpEnabledState(enabled);
    localStorage.setItem(LS_KEY_ORP, String(enabled));
  }, []);

  const setPunctuationPause = useCallback((enabled: boolean) => {
    setPunctuationPauseState(enabled);
    localStorage.setItem(LS_KEY_PUNCT_PAUSE, String(enabled));
  }, []);

  const setPeripheralFade = useCallback((enabled: boolean) => {
    setPeripheralFadeState(enabled);
    localStorage.setItem(LS_KEY_PERIPHERAL_FADE, String(enabled));
  }, []);

  const setLongWordCompensation = useCallback((enabled: boolean) => {
    setLongWordCompensationState(enabled);
    localStorage.setItem(LS_KEY_LONG_WORD_COMP, String(enabled));
  }, []);

  const setMainWordFontSize = useCallback((size: number) => {
    const clamped = Math.min(200, Math.max(60, size));
    setMainWordFontSizeState(clamped);
    localStorage.setItem(LS_KEY_MAIN_FONT_SIZE, String(clamped));
  }, []);

  const setChunkMode = useCallback((mode: ChunkMode) => {
    setChunkModeState(mode);
    localStorage.setItem(LS_KEY_CHUNK_MODE, mode);
  }, []);

  const updateSessionStats = useCallback((delta: Partial<SessionStats>) => {
    setSessionStatsState((prev) => {
      const next: SessionStats = { ...prev, ...delta };
      // Recalculate effectiveWpm whenever wordsRead or activeTimeMs changes
      if (next.activeTimeMs > 0) {
        next.effectiveWpm = Math.round(next.wordsRead / (next.activeTimeMs / 60_000));
      }
      try { localStorage.setItem(LS_KEY_SESSION_STATS, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const resetSessionStats = useCallback(() => {
    const fresh = { ...EMPTY_SESSION_STATS };
    setSessionStatsState(fresh);
    try { localStorage.setItem(LS_KEY_SESSION_STATS, JSON.stringify(fresh)); } catch { /* ignore */ }
  }, []);

  return (
    <ReaderContext.Provider
      value={{
        words,
        currentWordIndex,
        isPlaying,
        wpm,
        fileMetadata,
        fileId,
        isLoading,
        loadingProgress,
        pageBreaks,
        currentPage,
        totalPages,
        structureMap,
        records,
        windowSize,
        highlightColor,
        orientation,
        theme,
        orpEnabled,
        punctuationPause,
        peripheralFade,
        longWordCompensation,
        mainWordFontSize,
        chunkMode,
        sessionStats,
        setWords,
        setCurrentWordIndex,
        setIsPlaying,
        setWpm,
        setFileMetadata,
        setFileId,
        setIsLoading,
        setLoadingProgress,
        resetReader,
        setPageBreaks,
        setStructureMap,
        goToPage,
        goToWord,
        setRecords,
        setWindowSize,
        setHighlightColor,
        setOrientation,
        setTheme,
        setOrpEnabled,
        setPunctuationPause,
        setPeripheralFade,
        setLongWordCompensation,
        setMainWordFontSize,
        setChunkMode,
        updateSessionStats,
        resetSessionStats,
      }}
    >
      {children}
    </ReaderContext.Provider>
  );
}
