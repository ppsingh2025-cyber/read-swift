/**
 * App
 *
 * Root component. New 4-layer layout:
 *   1. Top bar  — burger menu (left) · brand (center) · donate (right)
 *   2. Reading main — viewport + ORP + context preview
 *   3. Navigation layer — page nav · word nav (hidden in focus mode)
 *   4. Bottom bar — Controls (sticky, always visible)
 *
 * Burger menu handles: theme toggle, all display/reading settings, history,
 * feedback link, help trigger, and app version.
 *
 * The paste/URL panel slides in above the bottom bar when the 📋 button is pressed.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReaderContext } from './context/useReaderContext';
import { useRSVPEngine } from './hooks/useRSVPEngine';
import { useChunkEngine } from './hooks/useChunkEngine';
import ReaderViewport from './components/ReaderViewport';
import Controls from './components/Controls';
import InputPanel from './components/InputPanel';
import PageNavigator from './components/PageNavigator';
import WordNavigator from './components/WordNavigator';
import ContextPreview from './components/ContextPreview';
import BurgerMenu from './components/BurgerMenu';
import ThemeToggle from './components/ThemeToggle';
import AppFooter from './components/AppFooter';
import HelpModal from './components/HelpModal';
import { parsePDF } from './parsers/pdfParser';
import { parseEPUB } from './parsers/epubParser';
import { parseFile } from './parsers/textParser';
import { normalizeText, tokenize } from './utils/textUtils';
import { normalizePages } from './utils/contentNormalizer';
import { saveRecord } from './utils/recordsUtils';
import { buildStructureMap, buildStructureMapFromWords } from './utils/structureUtils';
import { AuthProvider } from './auth/AuthContext';
import SignInPrompt from './auth/SignInPrompt';
import UserAvatar from './components/UserAvatar';
import SyncStatusIndicator from './components/SyncStatusIndicator';
import { Toaster } from 'react-hot-toast';
import './styles/app.css';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const STREAMING_EXTS = new Set(['pdf', 'epub']);
const TEXT_EXTS = new Set(['txt', 'md', 'html', 'htm', 'rtf', 'srt', 'docx']);

export default function App() {
  const {
    words,
    currentWordIndex,
    isPlaying,
    isLoading,
    loadingProgress,
    wpm,
    fileMetadata,
    records,
    windowSize,
    highlightColor,
    orientation,
    orpEnabled,
    peripheralFade,
    theme,
    mainWordFontSize,
    chunkMode,
    setWords,
    setCurrentWordIndex,
    setFileMetadata,
    setFileId,
    setIsLoading,
    setLoadingProgress,
    setIsPlaying,
    setPageBreaks,
    setStructureMap,
    setRecords,
    resetSessionStats,
  } = useReaderContext();

  const { wordWindow, play, pause, reset, faster, slower, prevWord, nextWord } = useRSVPEngine();

  /** Highlight index: center for odd sizes, left-middle for even sizes */
  const highlightIndex = Math.ceil(windowSize / 2) - 1;

  // Apply phrase-based chunking when in intelligent mode
  const { chunkWindow, chunkHighlightIndex } = useChunkEngine(
    words,
    currentWordIndex,
    windowSize,
    chunkMode,
    wordWindow,
    highlightIndex,
  );

  const [showHelp, setShowHelp] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  /** Hidden file input for the top bar upload button */
  const topBarFileInputRef = useRef<HTMLInputElement>(null);

  /** Apply theme as a data attribute on <html> so CSS variables cascade */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /** Persist reading progress to the record whenever reading is paused */
  useEffect(() => {
    if (!isPlaying && words.length > 0 && fileMetadata) {
      const meta = records.find((r) => r.name === fileMetadata.name);
      if (meta) {
        const updated = saveRecord({
          ...meta,
          lastWordIndex: currentWordIndex,
          lastReadAt: new Date().toISOString(),
          wpm,
        });
        setRecords(updated);
      }
      setSessionCompleted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const finaliseWords = useCallback(
    (allWords: string[], sourceName: string, breaks: number[] = [], rawLines?: string[]) => {
      if (allWords.length === 0) {
        alert('No readable text found.');
        return;
      }
      setWords(allWords);
      setPageBreaks(breaks);
      setFileId(sourceName);
      resetSessionStats();
      // Build structural markers for richer context rendering
      const sMap = rawLines && rawLines.length > 0
        ? buildStructureMap(rawLines, allWords)
        : buildStructureMapFromWords(allWords);
      setStructureMap(sMap);
      const existing = records.find((r) => r.name === sourceName);
      const restoredIndex =
        existing &&
        existing.lastWordIndex >= 0 &&
        existing.lastWordIndex < allWords.length
          ? existing.lastWordIndex
          : 0;
      if (restoredIndex > 0) setCurrentWordIndex(restoredIndex);
      const updated = saveRecord({
        name: sourceName,
        wordCount: allWords.length,
        lastWordIndex: restoredIndex,
        lastReadAt: new Date().toISOString(),
        wpm,
      });
      setRecords(updated);
    },
    [setWords, setPageBreaks, setFileId, resetSessionStats, setStructureMap, setCurrentWordIndex, records, wpm, setRecords],
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(
          `File is too large (max 100 MB). Selected file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
        );
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!STREAMING_EXTS.has(ext) && !TEXT_EXTS.has(ext)) {
        alert(
          'Unsupported file type. Supported formats: PDF, EPUB, TXT, MD, HTML, RTF, SRT, DOCX.',
        );
        return;
      }
      setIsPlaying(false);
      setIsLoading(true);
      setLoadingProgress(0);
      setFileMetadata({ name: file.name, size: file.size, type: ext });
      const allWords: string[] = [];
      const breaks: number[] = [];
      const allRawLines: string[] = [];
      try {
        if (ext === 'pdf') {
          // Stage 1 — Raw extraction: stream pages from pdfjs-dist.
          // Progress is scaled to 0–80 % during collection so the user sees
          // incremental feedback; the final 20 % covers normalization + tokenization.
          const rawPages: string[] = [];
          for await (const pageText of parsePDF(file, (p) =>
            setLoadingProgress(Math.round(p.percent * 0.8)),
          )) {
            rawPages.push(pageText);
          }

          // Stage 3+4 — Normalize: classify and remove headers/footers/page-numbers.
          // Runs once here, never during playback.
          const { normalizedPages, stats } = normalizePages(rawPages, import.meta.env.DEV);
          if (import.meta.env.DEV) {
            console.debug('[ingestion] PDF normalization stats:', stats);
          }
          setLoadingProgress(90);

          // Stage 4 output — Tokenize normalized pages into the word array.
          for (const pageText of normalizedPages) {
            breaks.push(allWords.length);
            allRawLines.push(...pageText.split('\n'));
            allWords.push(...tokenize(normalizeText(pageText)));
          }
        } else if (ext === 'epub') {
          // Stage 1 — Raw extraction: stream chapters from epubjs.
          const rawPages: string[] = [];
          for await (const chapterText of parseEPUB(file, (p) =>
            setLoadingProgress(Math.round(p.percent * 0.8)),
          )) {
            rawPages.push(chapterText);
          }

          // Stage 3+4 — Normalize chapters the same way as PDF pages.
          const { normalizedPages, stats } = normalizePages(rawPages, import.meta.env.DEV);
          if (import.meta.env.DEV) {
            console.debug('[ingestion] EPUB normalization stats:', stats);
          }
          setLoadingProgress(90);

          for (const pageText of normalizedPages) {
            breaks.push(allWords.length);
            allRawLines.push(...pageText.split('\n'));
            allWords.push(...tokenize(normalizeText(pageText)));
          }
        } else {
          setLoadingProgress(50);
          const { words: parsed, rawLines } = await parseFile(file);
          breaks.push(0);
          allWords.push(...parsed);
          if (rawLines) allRawLines.push(...rawLines);
          setLoadingProgress(100);
        }
        finaliseWords(allWords, file.name, breaks, allRawLines.length > 0 ? allRawLines : undefined);
      } catch (err) {
        console.error('Error parsing file:', err);
        alert(
          err instanceof Error
            ? err.message
            : 'Failed to parse the file. Please try a different file.',
        );
      } finally {
        setIsLoading(false);
        setLoadingProgress(100);
      }
    },
    [setIsPlaying, setIsLoading, setLoadingProgress, setFileMetadata, finaliseWords],
  );

  const handleTextReady = useCallback(
    (words: string[], sourceName: string, rawLines?: string[]) => {
      setFileMetadata({ name: sourceName, size: 0, type: 'text' });
      finaliseWords(words, sourceName, [], rawLines);
      setShowPaste(false); // collapse paste panel after loading
    },
    [setFileMetadata, finaliseWords],
  );

  /** Global keyboard shortcuts */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHelp(false);
        setIsFocused(false);
        setShowPaste(false);
        return;
      }
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'button' || tag === 'select' || tag === 'textarea') return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isPlaying) { pause(); } else { play(); }
          break;
        case 'ArrowUp':
          e.preventDefault();
          faster();
          break;
        case 'ArrowDown':
          e.preventDefault();
          slower();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevWord();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextWord();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, play, pause, faster, slower, prevWord, nextWord]);

  const toggleFocus = useCallback(() => setIsFocused((f) => !f), []);
  const togglePaste = useCallback(() => setShowPaste((p) => !p), []);

  return (
    <AuthProvider>
    <div className={`appShell${isFocused ? ' appShellFocused' : ''}`}>

      {/* ── 1. Top bar ──────────────────────────────────────────── */}
      <header className="topBar">
        <div className="topBarLeft">
          <BurgerMenu onFileSelect={handleFileSelect} />
          <input
            ref={topBarFileInputRef}
            type="file"
            accept=".pdf,.epub,.txt,.md,.html,.htm,.rtf,.srt,.docx"
            className="topBarHiddenInput"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { handleFileSelect(file); e.currentTarget.value = ''; }
            }}
            aria-label="Upload file"
          />
          <button
            className="topBarIconBtn"
            onClick={() => topBarFileInputRef.current?.click()}
            disabled={isLoading}
            title="Upload file (PDF, EPUB, TXT, MD, HTML, RTF, SRT, DOCX)"
            aria-label="Upload file"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 15V3m0 0l-4 4m4-4l4 4"/>
              <path d="M2 17v2a2 2 0 002 2h16a2 2 0 002-2v-2"/>
            </svg>
          </button>
          <button
            className={`topBarIconBtn${showPaste ? ' topBarIconBtnActive' : ''}`}
            onClick={togglePaste}
            title="Paste text"
            aria-label="Toggle paste panel"
            aria-pressed={showPaste}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="2" width="6" height="4" rx="1"/>
              <path d="M9 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2h-2"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="13" y2="16"/>
            </svg>
          </button>
        </div>
        <div className="topBarBrand">
          <img
            src={theme === 'day' ? '/icons/icon-day.svg' : '/icons/icon-night.svg'}
            className="topBarIcon"
            alt=""
            aria-hidden="true"
          />
          <span className="topBarTitle">ReadSwift</span>
        </div>
        <div className="topBarActions">
          <SyncStatusIndicator />
          <UserAvatar />
          <button
            className="helpBtn"
            onClick={() => setShowHelp(true)}
            title="How to Use ReadSwift"
            aria-label="How to Use ReadSwift"
          >
            ?
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* ── 2. Reading main ─────────────────────────────────────── */}
      <main className="readingMain">
        <div className="viewportWrapper">
          <ReaderViewport
            wordWindow={chunkWindow}
            highlightIndex={chunkHighlightIndex}
            highlightColor={highlightColor}
            orientation={orientation}
            orpEnabled={orpEnabled}
            peripheralFade={peripheralFade}
            isLoading={isLoading}
            loadingProgress={loadingProgress}
            hasWords={words.length > 0}
            fullHeight={isFocused}
            mainWordFontSize={mainWordFontSize}
            onFileSelect={handleFileSelect}
            onShowPaste={togglePaste}
          />
          {/* Maximize / minimize button */}
          <button
            className={`maximizeBtn${isFocused ? ' maximizeBtnVisible' : ''}`}
            onClick={toggleFocus}
            title={isFocused ? 'Exit focus mode (Esc)' : 'Enter focus mode'}
            aria-label={isFocused ? 'Exit focus mode' : 'Enter focus mode'}
          >
            {isFocused ? '⊡' : '⊞'}
          </button>
        </div>
        {!isFocused && <ContextPreview />}
      </main>

      {/* ── 3. Navigation layer ─────────────────────────────────── */}
      {!isFocused && (
        <section className="navLayer" aria-label="Navigation">
          <PageNavigator />
          <WordNavigator onPrevWord={prevWord} onNextWord={nextWord} />
        </section>
      )}

      {/* ── Paste / URL panel (above bottom bar, collapsible) ───── */}
      {showPaste && !isFocused && (
        <div className="pasteArea">
          <InputPanel onTextReady={handleTextReady} />
        </div>
      )}

      {/* ── 4. Bottom control bar (always visible) ──────────────── */}
      <div className="controlsBar">
        <Controls
          onFileSelect={handleFileSelect}
          onPlay={play}
          onPause={pause}
          onReset={reset}
          onFaster={faster}
          onSlower={slower}
          onPrevWord={prevWord}
          onNextWord={nextWord}
          onPasteToggle={togglePaste}
          pasteOpen={showPaste}
          focused={isFocused}
        />
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      <SignInPrompt
        sessionCompleted={sessionCompleted}
        onDismiss={() => setSessionCompleted(false)}
      />
      <Toaster position="bottom-center" />

      {/* ── Footer ──────────────────────────────────────────────── */}
      {!isFocused && <AppFooter />}
    </div>
    </AuthProvider>
  );
}
