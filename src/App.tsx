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

import { useCallback, useEffect, useState } from 'react';
import { useReaderContext } from './context/useReaderContext';
import { useRSVPEngine } from './hooks/useRSVPEngine';
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
import { saveRecord } from './utils/recordsUtils';
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
    setWords,
    setCurrentWordIndex,
    setFileMetadata,
    setIsLoading,
    setLoadingProgress,
    setIsPlaying,
    setPageBreaks,
    setRecords,
  } = useReaderContext();

  const { wordWindow, play, pause, reset, faster, slower, prevWord, nextWord } = useRSVPEngine();

  const [showHelp, setShowHelp] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPaste, setShowPaste] = useState(false);

  /** Highlight index: center for odd sizes, left-middle for even sizes */
  const highlightIndex = Math.ceil(windowSize / 2) - 1;

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const finaliseWords = useCallback(
    (allWords: string[], sourceName: string, breaks: number[] = []) => {
      if (allWords.length === 0) {
        alert('No readable text found.');
        return;
      }
      setWords(allWords);
      setPageBreaks(breaks);
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
    [setWords, setPageBreaks, setCurrentWordIndex, records, wpm, setRecords],
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
      try {
        if (ext === 'pdf') {
          for await (const pageText of parsePDF(file, (p) => setLoadingProgress(p.percent))) {
            breaks.push(allWords.length);
            allWords.push(...tokenize(normalizeText(pageText)));
          }
        } else if (ext === 'epub') {
          for await (const chapterText of parseEPUB(file, (p) => setLoadingProgress(p.percent))) {
            breaks.push(allWords.length);
            allWords.push(...tokenize(normalizeText(chapterText)));
          }
        } else {
          setLoadingProgress(50);
          const { words: parsed } = await parseFile(file);
          breaks.push(0);
          allWords.push(...parsed);
          setLoadingProgress(100);
        }
        finaliseWords(allWords, file.name, breaks);
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
    (words: string[], sourceName: string) => {
      setFileMetadata({ name: sourceName, size: 0, type: 'text' });
      finaliseWords(words, sourceName);
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
    <div className={`appShell${isFocused ? ' appShellFocused' : ''}`}>

      {/* ── 1. Top bar ──────────────────────────────────────────── */}
      <header className="topBar">
        <BurgerMenu onFileSelect={handleFileSelect} onShowHelp={() => setShowHelp(true)} />
        <div className="topBarBrand">
          <img
            src={theme === 'day' ? '/icons/icon-day.svg' : '/icons/icon-night.svg'}
            className="topBarIcon"
            alt=""
            aria-hidden="true"
          />
          <span className="topBarTitle">ReadSwift</span>
        </div>
        <ThemeToggle />
      </header>

      {/* ── 2. Reading main ─────────────────────────────────────── */}
      <main className="readingMain">
        <div className="viewportWrapper">
          <ReaderViewport
            wordWindow={wordWindow}
            highlightIndex={highlightIndex}
            highlightColor={highlightColor}
            orientation={orientation}
            orpEnabled={orpEnabled}
            peripheralFade={peripheralFade}
            isLoading={isLoading}
            loadingProgress={loadingProgress}
            hasWords={words.length > 0}
            fullHeight={isFocused}
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
      />

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* ── Footer ──────────────────────────────────────────────── */}
      {!isFocused && <AppFooter />}
    </div>
  );
}
