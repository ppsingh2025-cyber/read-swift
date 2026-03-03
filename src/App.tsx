/**
 * App
 *
 * Root component. Wires together:
 *  - File parsing (PDF/EPUB/TXT/MD/HTML/RTF/SRT/DOCX)
 *  - Paste text mode and URL reader
 *  - ReaderContext state
 *  - useRSVPEngine hook
 *  - Keyboard shortcuts
 *  - ReaderViewport + Controls + Settings + InputPanel
 *  - Day/Night theme toggle
 *  - Help modal
 */

import { useCallback, useEffect, useState } from 'react';
import { useReaderContext } from './context/useReaderContext';
import { useRSVPEngine } from './hooks/useRSVPEngine';
import ReaderViewport from './components/ReaderViewport';
import Controls from './components/Controls';
import Settings from './components/Settings';
import InputPanel from './components/InputPanel';
import ReadingHistory from './components/ReadingHistory';
import PageNavigator from './components/PageNavigator';
import WordNavigator from './components/WordNavigator';
import ContextPreview from './components/ContextPreview';
import DonateButton from './components/DonateButton';
import FeedbackButton from './components/FeedbackButton';
import HelpModal from './components/HelpModal';
import { parsePDF } from './parsers/pdfParser';
import { parseEPUB } from './parsers/epubParser';
import { parseFile } from './parsers/textParser';
import { normalizeText, tokenize } from './utils/textUtils';
import { saveRecord } from './utils/recordsUtils';
import './styles/app.css';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

/** File extensions handled by PDF/EPUB parsers (streaming, with progress) */
const STREAMING_EXTS = new Set(['pdf', 'epub']);
/** File extensions handled by the unified text parser */
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
    theme,
    setWords,
    setCurrentWordIndex,
    setFileMetadata,
    setIsLoading,
    setLoadingProgress,
    setIsPlaying,
    setPageBreaks,
    setRecords,
    setTheme,
  } = useReaderContext();

  const { wordWindow, play, pause, reset, faster, slower, prevWord, nextWord } = useRSVPEngine();

  const [showHelp, setShowHelp] = useState(false);

  /** Highlight index is always the center slot of the window */
  const highlightIndex = Math.floor(windowSize / 2);

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
    // Only run when isPlaying flips to false; other deps are stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  /**
   * Shared finalisation step: store words into the engine and save a record.
   * Used by both the file-select handler and the InputPanel text-ready callback.
   */
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

  /** Handle a file selected by the user (file input) */
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
          for await (const pageText of parsePDF(file, (p) =>
            setLoadingProgress(p.percent),
          )) {
            breaks.push(allWords.length);
            allWords.push(...tokenize(normalizeText(pageText)));
          }
        } else if (ext === 'epub') {
          for await (const chapterText of parseEPUB(file, (p) =>
            setLoadingProgress(p.percent),
          )) {
            breaks.push(allWords.length);
            allWords.push(...tokenize(normalizeText(chapterText)));
          }
        } else {
          // Unified text parser for all other formats
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

  /** Called by InputPanel when paste/URL text is ready */
  const handleTextReady = useCallback(
    (words: string[], sourceName: string) => {
      setFileMetadata({ name: sourceName, size: 0, type: 'text' });
      finaliseWords(words, sourceName);
    },
    [setFileMetadata, finaliseWords],
  );

  /** Global keyboard shortcuts */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when focus is on an interactive element
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
        case 'Escape':
          setShowHelp(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, play, pause, faster, slower, prevWord, nextWord]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'night' ? 'day' : 'night');
  }, [theme, setTheme]);

  return (
    <div className="appWrapper">
      <header className="appHeader">
        <div className="appBrand">
          <h1>
            <img src="/icons/icon.svg" className="brandIcon" alt="" aria-hidden="true" />
            ReadSwift
          </h1>
          <p className="subtitle">Speed Reader</p>
        </div>
        <div className="headerActions">
          {/* Day / Night theme toggle */}
          <button
            className="themeBtn"
            onClick={toggleTheme}
            title={theme === 'night' ? 'Switch to Day mode' : 'Switch to Night mode'}
            aria-label={theme === 'night' ? 'Switch to Day mode' : 'Switch to Night mode'}
          >
            {theme === 'night' ? '☀' : '🌙'}
          </button>

          {/* Help button */}
          <button
            className="helpBtn"
            onClick={() => setShowHelp(true)}
            title="Help & Features"
            aria-label="Open help"
          >
            ?
          </button>

          <DonateButton />
        </div>
      </header>

      <main className="appMain">
        <div className="readingArea">
          <div className="viewportWrapper">
            <ReaderViewport
              wordWindow={wordWindow}
              highlightIndex={highlightIndex}
              highlightColor={highlightColor}
              orientation={orientation}
              orpEnabled={orpEnabled}
              isLoading={isLoading}
              loadingProgress={loadingProgress}
              hasWords={words.length > 0}
            />
          </div>
          <ContextPreview />
        </div>

        <Controls
          onFileSelect={handleFileSelect}
          onPlay={play}
          onPause={pause}
          onReset={reset}
          onFaster={faster}
          onSlower={slower}
          onPrevWord={prevWord}
          onNextWord={nextWord}
        />

        <Settings />

        <InputPanel onTextReady={handleTextReady} />

        <PageNavigator />

        <WordNavigator onPrevWord={prevWord} onNextWord={nextWord} />

        <ReadingHistory onFileSelect={handleFileSelect} />

        <section className="shortcuts" aria-label="Keyboard shortcuts">
          <kbd>Space</kbd> Play/Pause &nbsp;
          <kbd>←</kbd> Prev &nbsp;
          <kbd>→</kbd> Next &nbsp;
          <kbd>↑</kbd> Faster &nbsp;
          <kbd>↓</kbd> Slower
        </section>
      </main>

      <div className="preFooter">
        <FeedbackButton />
      </div>

      <footer className="appFooter">
        <span>A product by&nbsp;</span>
        <a
          href="https://www.techscript.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="techscriptLink"
        >
          <img src="/icons/icon.svg" className="footerIcon" alt="" aria-hidden="true" />
          Techscript
        </a>
      </footer>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
