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
  useRef,
  useState,
} from 'react';
import { ReaderContext, type FileMetadata, type ReadingRecord, type WindowSize, type Orientation, type Theme, type ChunkMode, type SessionStats, type StructuralMarker, type ModeId, type CustomMode } from './readerContextDef';
import { loadRecords } from '../utils/recordsUtils';
import { PRESET_MODES } from '../config/readingModePresets';
import type { PresetModeId, ModeSettings } from '../types/readingModes';
import type { StoredSession } from '../types/metadata';
import { getThemeOrpAccent, isOrpColorInTheme } from '../config/orpColors';

const LS_KEY_INDEX = 'fastread_word_index';
const LS_KEY_WPM = 'fastread_wpm';

function modeWpmKey(modeId: string): string {
  return `fastread_wpm_${modeId}`;
}
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
const LS_KEY_FOCUS_MARKER = 'fastread_focus_marker';
const LS_KEY_FOCAL_LINE = 'fastread_focal_line';
const LS_KEY_ACTIVE_MODE = 'fastread_active_mode';
const LS_KEY_CUSTOM_MODES = 'fastread_custom_modes';
const LS_KEY_ACTIVE_CUSTOM_MODE = 'fastread_active_custom_mode_id';
const LS_KEY_ORP_COLORED = 'fastread_orp_colored';
const LS_KEY_SESSION_HISTORY = 'fastread_session_history';
const LS_KEY_CONTEXT_FONT_SIZE = 'fastread_context_font_size';
// old key kept as read-only for migration
const LS_KEY_CONTEXT_SAME_SIZE_LEGACY = 'fastread_context_same_size';
const LS_KEY_CONTEXT_OPACITY   = 'fastread_context_opacity';
const DEFAULT_WPM = 250;
const DEFAULT_WINDOW_SIZE: WindowSize = 1;
const DEFAULT_ORIENTATION: Orientation = 'horizontal';
const DEFAULT_THEME: Theme = 'obsidian';
const DEFAULT_HIGHLIGHT_COLOR = getThemeOrpAccent(DEFAULT_THEME); // matches DEFAULT_THEME accent
const DEFAULT_ORP = true;
const DEFAULT_PUNCT_PAUSE = true;
const DEFAULT_PERIPHERAL_FADE = true;
const DEFAULT_LONG_WORD_COMP = true;
const DEFAULT_MAIN_FONT_SIZE = 100;
const DEFAULT_CHUNK_MODE: ChunkMode = 'fixed';
const DEFAULT_FOCUS_MARKER = true;
const DEFAULT_FOCAL_LINE = true;

const EMPTY_SESSION_STATS: SessionStats = {
  wordsRead: 0,
  startTime: 0,
  activeTimeMs: 0,
  effectiveWpm: 0,
};

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  // New user = no onboarding flag yet -- apply research-backed defaults
  const isNewUser = !localStorage.getItem('fastread_onboarding_complete');

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
    if (isNewUser) return 'horizontal';
    const saved = localStorage.getItem(LS_KEY_ORIENTATION);
    if (saved === 'vertical' || saved === 'horizontal') return saved as Orientation;
    // No saved preference — always fall back to horizontal (never screen-width-derived)
    return DEFAULT_ORIENTATION;
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(LS_KEY_THEME) as Theme | null;
    const valid: Theme[] = ['obsidian', 'midnight', 'warm', 'day'];
    const resolved = (saved && valid.includes(saved)) ? saved : DEFAULT_THEME;
    // Apply theme immediately so the DOM reflects the saved preference before first paint
    document.documentElement.setAttribute('data-theme', resolved);
    return resolved;
  });
  const [orpEnabled, setOrpEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(LS_KEY_ORP);
    if (saved !== null) return saved === 'true';
    return isNewUser ? true : DEFAULT_ORP;
  });
  const [orpColored, setOrpColoredState] = useState<boolean>(() => {
    const saved = localStorage.getItem(LS_KEY_ORP_COLORED);
    return saved !== 'false'; // default true
  });
  const [punctuationPause, setPunctuationPauseState] = useState<boolean>(() => {
    const saved = localStorage.getItem(LS_KEY_PUNCT_PAUSE);
    return saved === null ? DEFAULT_PUNCT_PAUSE : saved === 'true';
  });
  const [peripheralFade, setPeripheralFadeState] = useState<boolean>(() => {
    const saved = localStorage.getItem(LS_KEY_PERIPHERAL_FADE);
    if (saved !== null) return saved === 'true';
    return isNewUser ? false : DEFAULT_PERIPHERAL_FADE;
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
  const [sessionHistory, setSessionHistoryState] = useState<StoredSession[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY_SESSION_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredSession[];
        // Deduplicate by bookName on load, keeping the first (most recent) occurrence
        const seen = new Set<string>();
        return parsed.filter((s: StoredSession) => {
          if (seen.has(s.bookName)) return false;
          seen.add(s.bookName);
          return true;
        });
      }
    } catch { /* ignore parse errors */ }
    return [];
  });
  const [focusMarkerEnabled, setFocusMarkerEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(LS_KEY_FOCUS_MARKER);
    return saved === null ? DEFAULT_FOCUS_MARKER : saved === 'true';
  });
  const [focalLine, setFocalLineState] = useState<boolean>(() => {
    const saved = localStorage.getItem(LS_KEY_FOCAL_LINE);
    if (saved !== null) return saved === 'true';
    return DEFAULT_FOCAL_LINE;
  });

  const [activeMode, setActiveModeState] = useState<ModeId>(() => {
    const saved = localStorage.getItem(LS_KEY_ACTIVE_MODE) as ModeId | null;
    if (saved) return saved;
    return isNewUser ? 'focus' : 'read';
  });
  const [savedCustomModes, setSavedCustomModesState] = useState<CustomMode[]>(() => {
    /** Legacy settings shape that may exist in stored custom modes */
    type LegacyModeSettings = Omit<ModeSettings, 'contextWordFontSize'> & { contextWordSameSize: boolean };
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY_CUSTOM_MODES) ?? '[]') as Array<
        Omit<CustomMode, 'settings'> & { settings: ModeSettings | LegacyModeSettings }
      >;
      return raw.map((mode): CustomMode => {
        const s = mode.settings as ModeSettings | LegacyModeSettings;
        if ('contextWordSameSize' in s) {
          const { contextWordSameSize, ...rest } = s as LegacyModeSettings;
          return { ...mode, settings: { ...rest, contextWordFontSize: contextWordSameSize ? 0 : 85 } };
        }
        return mode as CustomMode;
      });
    } catch { return []; }
  });
  const [activeCustomModeId, setActiveCustomModeIdState] = useState<string | null>(() => {
    return localStorage.getItem(LS_KEY_ACTIVE_CUSTOM_MODE);
  });
  const [contextWordFontSize, setContextWordFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem(LS_KEY_CONTEXT_FONT_SIZE);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    // Migrate from old boolean key
    const legacy = localStorage.getItem(LS_KEY_CONTEXT_SAME_SIZE_LEGACY);
    return legacy === 'false' ? 85 : 0; // 'false' meant "smaller" → medium; else same-as-main
  });
  const [contextWordOpacity, setContextWordOpacityState] = useState<number>(() => {
    const saved = localStorage.getItem(LS_KEY_CONTEXT_OPACITY);
    const parsed = saved ? parseFloat(saved) : NaN;
    return !isNaN(parsed) && parsed >= 0.2 && parsed <= 1.0 ? parsed : 0.65;
  });

  /** True while applyMode is executing — suppresses auto-switch to Custom */
  const applyingModeRef = useRef(false);

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
    // Also save per active mode
    if (activeMode) {
      localStorage.setItem(modeWpmKey(activeMode), String(wpm));
    }
  }, [wpm, activeMode]);

  // Persist active mode
  useEffect(() => {
    localStorage.setItem(LS_KEY_ACTIVE_MODE, activeMode);
  }, [activeMode]);

  // Persist custom modes
  useEffect(() => {
    localStorage.setItem(LS_KEY_CUSTOM_MODES, JSON.stringify(savedCustomModes));
    // FUTURE: sync to Supabase — stub only, do not implement yet
    // syncCustomModesToSupabase(savedCustomModes);
  }, [savedCustomModes]);

  // Persist active custom mode ID
  useEffect(() => {
    if (activeCustomModeId) {
      localStorage.setItem(LS_KEY_ACTIVE_CUSTOM_MODE, activeCustomModeId);
    } else {
      localStorage.removeItem(LS_KEY_ACTIVE_CUSTOM_MODE);
    }
  }, [activeCustomModeId]);

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

  const setActiveMode = useCallback((mode: ModeId) => {
    setActiveModeState(mode);
  }, []);

  const setSavedCustomModes = useCallback((modes: CustomMode[]) => {
    setSavedCustomModesState(modes);
  }, []);

  const setActiveCustomModeId = useCallback((id: string | null) => {
    setActiveCustomModeIdState(id);
  }, []);

  // ─── Raw internal setters (persist to localStorage) ────────────────────────

  const setWindowSizeRaw = useCallback((size: WindowSize) => {
    setWindowSizeState(size);
    localStorage.setItem(LS_KEY_WINDOW_SIZE, String(size));
  }, []);

  const setOrpEnabledRaw = useCallback((enabled: boolean) => {
    setOrpEnabledState(enabled);
    localStorage.setItem(LS_KEY_ORP, String(enabled));
  }, []);

  const setOrpColored = useCallback((colored: boolean) => {
    setOrpColoredState(colored);
    localStorage.setItem(LS_KEY_ORP_COLORED, String(colored));
  }, []);

  const setPunctuationPauseRaw = useCallback((enabled: boolean) => {
    setPunctuationPauseState(enabled);
    localStorage.setItem(LS_KEY_PUNCT_PAUSE, String(enabled));
  }, []);

  const setPeripheralFadeRaw = useCallback((enabled: boolean) => {
    setPeripheralFadeState(enabled);
    localStorage.setItem(LS_KEY_PERIPHERAL_FADE, String(enabled));
  }, []);

  const setLongWordCompensationRaw = useCallback((enabled: boolean) => {
    setLongWordCompensationState(enabled);
    localStorage.setItem(LS_KEY_LONG_WORD_COMP, String(enabled));
  }, []);

  const setChunkModeRaw = useCallback((mode: ChunkMode) => {
    setChunkModeState(mode);
    localStorage.setItem(LS_KEY_CHUNK_MODE, mode);
  }, []);

  const setFocalLineRaw = useCallback((v: boolean) => {
    setFocalLineState(v);
    localStorage.setItem(LS_KEY_FOCAL_LINE, String(v));
  }, []);

  // ─── Mode-aware wrapped setters ─────────────────────────────────────────────
  // Any direct call (not inside applyMode) switches activeMode → 'custom'

  const setWindowSize = useCallback((size: WindowSize) => {
    setWindowSizeRaw(size);
    if (!applyingModeRef.current) {
      setActiveModeState('custom');
      setActiveCustomModeIdState(null);
    }
  }, [setWindowSizeRaw]);

  const setOrpEnabled = useCallback((enabled: boolean) => {
    setOrpEnabledRaw(enabled);
    if (!applyingModeRef.current) {
      setActiveModeState('custom');
      setActiveCustomModeIdState(null);
    }
  }, [setOrpEnabledRaw]);

  const setPunctuationPause = useCallback((enabled: boolean) => {
    setPunctuationPauseRaw(enabled);
    if (!applyingModeRef.current) {
      setActiveModeState('custom');
      setActiveCustomModeIdState(null);
    }
  }, [setPunctuationPauseRaw]);

  const setPeripheralFade = useCallback((enabled: boolean) => {
    setPeripheralFadeRaw(enabled);
    if (!applyingModeRef.current) {
      setActiveModeState('custom');
      setActiveCustomModeIdState(null);
    }
  }, [setPeripheralFadeRaw]);

  const setLongWordCompensation = useCallback((enabled: boolean) => {
    setLongWordCompensationRaw(enabled);
    if (!applyingModeRef.current) {
      setActiveModeState('custom');
      setActiveCustomModeIdState(null);
    }
  }, [setLongWordCompensationRaw]);

  const setChunkMode = useCallback((mode: ChunkMode) => {
    setChunkModeRaw(mode);
    if (!applyingModeRef.current) {
      setActiveModeState('custom');
      setActiveCustomModeIdState(null);
    }
  }, [setChunkModeRaw]);

  const setFocalLine = useCallback((v: boolean) => {
    setFocalLineRaw(v);
    if (!applyingModeRef.current) {
      setActiveModeState('custom');
      setActiveCustomModeIdState(null);
    }
  }, [setFocalLineRaw]);

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
    document.documentElement.setAttribute('data-theme', t);
    // Auto-reset ORP color to new theme's accent if the current color
    // doesn't exist in the new theme's palette
    setHighlightColorState(current => {
      if (!isOrpColorInTheme(t, current)) {
        const accent = getThemeOrpAccent(t);
        localStorage.removeItem(LS_KEY_HIGHLIGHT_COLOR); // clear override
        return accent;
      }
      return current;
    });
  }, []);

  const setMainWordFontSize = useCallback((size: number) => {
    const clamped = Math.min(200, Math.max(60, size));
    setMainWordFontSizeState(clamped);
    localStorage.setItem(LS_KEY_MAIN_FONT_SIZE, String(clamped));
  }, []);

  const setContextWordFontSize = useCallback((v: number) => {
    setContextWordFontSizeState(v);
    localStorage.setItem(LS_KEY_CONTEXT_FONT_SIZE, String(v));
  }, []);

  const setContextWordOpacity = useCallback((v: number) => {
    const clamped = Math.max(0.2, Math.min(1.0, Math.round(v * 20) / 20));
    setContextWordOpacityState(clamped);
    localStorage.setItem(LS_KEY_CONTEXT_OPACITY, String(clamped));
  }, []);

  const updateSessionStats = useCallback((delta: Partial<SessionStats>) => {
    setSessionStatsState((prev) => {
      const next: SessionStats = { ...prev, ...delta };
      // Recalculate effectiveWpm only when enough active time has elapsed (≥ 2 s)
      if (next.activeTimeMs >= 2_000 && next.wordsRead > 0) {
        next.effectiveWpm = Math.round(next.wordsRead / (next.activeTimeMs / 60_000));
      } else {
        next.effectiveWpm = 0;
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

  const saveCurrentSession = useCallback(() => {
    setSessionStatsState(prev => {
      if (prev.wordsRead === 0) return prev;
      const entry: StoredSession = {
        id: crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
        bookName: fileMetadata?.name ?? 'Pasted text',
        startedAt: prev.startTime > 0 ? new Date(prev.startTime).toISOString() : new Date().toISOString(),
        durationMs: prev.activeTimeMs,
        wordsRead: prev.wordsRead,
        avgWpm: prev.effectiveWpm > 0 ? prev.effectiveWpm : (
          prev.activeTimeMs >= 2_000 ? Math.round(prev.wordsRead / (prev.activeTimeMs / 60_000)) : 0
        ),
      };
      setSessionHistoryState(hist => {
        const updated = [entry, ...hist.filter(h => h.bookName !== entry.bookName)].slice(0, 20);
        try { localStorage.setItem(LS_KEY_SESSION_HISTORY, JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
      const fresh = { ...EMPTY_SESSION_STATS };
      try { localStorage.setItem(LS_KEY_SESSION_STATS, JSON.stringify(fresh)); } catch { /* ignore */ }
      return fresh;
    });
  }, [fileMetadata]);

  const clearSessionHistory = useCallback(() => {
    setSessionHistoryState([]);
    try { localStorage.removeItem(LS_KEY_SESSION_HISTORY); } catch { /* ignore */ }
  }, []);

  // Save session on page hide / close
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentSession();
      }
    };
    const handleBeforeUnload = () => { saveCurrentSession(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [saveCurrentSession]);

  const setFocusMarkerEnabled = useCallback((enabled: boolean) => {
    setFocusMarkerEnabledState(enabled);
    localStorage.setItem(LS_KEY_FOCUS_MARKER, String(enabled));
  }, []);

  // ─── applyMode: atomically apply a full bundle of mode settings ─────────────
  const applyMode = useCallback((settings: ModeSettings) => {
    applyingModeRef.current = true;
    setWindowSizeRaw(settings.windowSize);
    setOrpEnabledRaw(settings.orpEnabled);
    setOrpColoredState(settings.orpColored);
    localStorage.setItem(LS_KEY_ORP_COLORED, String(settings.orpColored));
    setFocalLineRaw(settings.focalLine);
    setPeripheralFadeRaw(settings.peripheralFade);
    setPunctuationPauseRaw(settings.punctuationPause);
    setLongWordCompensationRaw(settings.longWordCompensation);
    setChunkModeRaw(settings.chunkMode);
    setContextWordFontSizeState(settings.contextWordFontSize);
    setContextWordOpacityState(settings.contextWordOpacity);
    // Reset the flag after React has batched all state updates
    queueMicrotask(() => { applyingModeRef.current = false; });
  }, [setWindowSizeRaw, setOrpEnabledRaw, setFocalLineRaw, setPeripheralFadeRaw, setPunctuationPauseRaw, setLongWordCompensationRaw, setChunkModeRaw]);

  const selectPresetMode = useCallback((modeId: PresetModeId) => {
    applyMode(PRESET_MODES[modeId].settings);
    setActiveModeState(modeId);
    setActiveCustomModeIdState(null);
    const savedModeWpm = localStorage.getItem(modeWpmKey(modeId));
    if (savedModeWpm) {
      const parsed = parseInt(savedModeWpm, 10);
      if (!isNaN(parsed) && parsed >= 60 && parsed <= 1500) {
        // User previously adjusted this mode's WPM — restore it and exit early.
        setWpmState(parsed);
        localStorage.setItem(LS_KEY_WPM, String(parsed));
        return;
      }
    }
    // No saved WPM → use preset default
    const defaultWpm = PRESET_MODES[modeId].defaultWpm;
    setWpmState(defaultWpm);
    localStorage.setItem(LS_KEY_WPM, String(defaultWpm));
    localStorage.setItem(modeWpmKey(modeId), String(defaultWpm));
  }, [applyMode]);

  const selectCustomMode = useCallback((mode: CustomMode) => {
    applyMode(mode.settings);
    if (mode.wpm !== undefined) {
      setWpm(mode.wpm);
    }
    setActiveModeState('custom');
    setActiveCustomModeIdState(mode.id);
  }, [applyMode, setWpm]);

  const contextValue = useMemo(() => ({
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
    orpColored,
    punctuationPause,
    peripheralFade,
    longWordCompensation,
    mainWordFontSize,
    chunkMode,
    contextWordFontSize,
    contextWordOpacity,
    sessionStats,
    sessionHistory,
    focusMarkerEnabled,
    focalLine,
    activeMode,
    savedCustomModes,
    activeCustomModeId,
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
    setOrpColored,
    setPunctuationPause,
    setPeripheralFade,
    setLongWordCompensation,
    setMainWordFontSize,
    setChunkMode,
    setContextWordFontSize,
    setContextWordOpacity,
    updateSessionStats,
    resetSessionStats,
    saveCurrentSession,
    clearSessionHistory,
    setFocusMarkerEnabled,
    setFocalLine,
    setActiveMode,
    setSavedCustomModes,
    setActiveCustomModeId,
    applyMode,
    selectPresetMode,
    selectCustomMode,
  }), [
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
    orpColored,
    punctuationPause,
    peripheralFade,
    longWordCompensation,
    mainWordFontSize,
    chunkMode,
    contextWordFontSize,
    contextWordOpacity,
    sessionStats,
    sessionHistory,
    focusMarkerEnabled,
    focalLine,
    activeMode,
    savedCustomModes,
    activeCustomModeId,
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
    setOrpColored,
    setPunctuationPause,
    setPeripheralFade,
    setLongWordCompensation,
    setMainWordFontSize,
    setChunkMode,
    setContextWordFontSize,
    setContextWordOpacity,
    updateSessionStats,
    resetSessionStats,
    saveCurrentSession,
    clearSessionHistory,
    setFocusMarkerEnabled,
    setFocalLine,
    setActiveMode,
    setSavedCustomModes,
    setActiveCustomModeId,
    applyMode,
    selectPresetMode,
    selectCustomMode,
  ]);

  return (
    <ReaderContext.Provider value={contextValue}>
      {children}
    </ReaderContext.Provider>
  );
}
