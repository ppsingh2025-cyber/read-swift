/**
 * App
 *
 * Root component. Wires together:
 *  - File parsing (PDF/EPUB)
 *  - ReaderContext state
 *  - useRSVPEngine hook
 *  - Keyboard shortcuts
 *  - ReaderViewport + Controls
 */

import { useCallback, useEffect } from 'react';
import { useReaderContext } from './context/useReaderContext';
import { useRSVPEngine } from './hooks/useRSVPEngine';
import ReaderViewport from './components/ReaderViewport';
import Controls from './components/Controls';
import ReadingHistory from './components/ReadingHistory';
import PageNavigator from './components/PageNavigator';
import WordNavigator from './components/WordNavigator';
import ContextPreview from './components/ContextPreview';
import DonateButton from './components/DonateButton';
import FeedbackButton from './components/FeedbackButton';
import { parsePDF } from './parsers/pdfParser';
import { parseEPUB } from './parsers/epubParser';
import { normalizeText, tokenize } from './utils/textUtils';
import { saveRecord } from './utils/recordsUtils';
import './styles/app.css';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

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
    setWords,
    setCurrentWordIndex,
    setFileMetadata,
    setIsLoading,
    setLoadingProgress,
    setIsPlaying,
    setPageBreaks,
    setRecords,
  } = useReaderContext();

  const { currentWord, play, pause, reset, faster, slower, prevWord, nextWord } = useRSVPEngine();

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

  /** Handle a file selected by the user */
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(
          `File is too large (max 100 MB). Selected file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
        );
        return;
      }

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'epub') {
        alert('Only PDF and EPUB files are supported.');
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
            const normalized = normalizeText(pageText);
            allWords.push(...tokenize(normalized));
          }
        } else {
          for await (const chapterText of parseEPUB(file, (p) =>
            setLoadingProgress(p.percent),
          )) {
            breaks.push(allWords.length);
            const normalized = normalizeText(chapterText);
            allWords.push(...tokenize(normalized));
          }
        }

        if (allWords.length === 0) {
          alert('No readable text found in this file.');
        } else {
          setWords(allWords);
          setPageBreaks(breaks);
          // Restore previous word index if a record exists for this file
          const existing = records.find((r) => r.name === file.name);
          const restoredIndex =
            existing &&
            existing.lastWordIndex >= 0 &&
            existing.lastWordIndex < allWords.length
              ? existing.lastWordIndex
              : 0;
          if (restoredIndex > 0) {
            setCurrentWordIndex(restoredIndex);
          }
          // Save / update the reading record
          const updated = saveRecord({
            name: file.name,
            wordCount: allWords.length,
            lastWordIndex: restoredIndex,
            lastReadAt: new Date().toISOString(),
            wpm,
          });
          setRecords(updated);
        }
      } catch (err) {
        console.error('Error parsing file:', err);
        alert('Failed to parse the file. Please try a different PDF or EPUB.');
      } finally {
        setIsLoading(false);
        setLoadingProgress(100);
      }
    },
    [setIsPlaying, setIsLoading, setLoadingProgress, setFileMetadata, setWords, setPageBreaks, setCurrentWordIndex, records, wpm, setRecords],
  );

  /** Global keyboard shortcuts */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when focus is on an interactive element
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'button' || tag === 'select') return;

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

  return (
    <div className="appWrapper">
      <header className="appHeader">
        <div className="appBrand">
          <h1>
            <img src="/icons/icon.svg" className="brandIcon" alt="" aria-hidden="true" />
            ReadSwift
          </h1>
          <p className="subtitle">RSVP Reader</p>
        </div>
        <div className="headerActions">
          <FeedbackButton />
          <DonateButton />
        </div>
      </header>

      <main className="appMain">
        <div className="readingArea">
          <div className="viewportWrapper">
            <ReaderViewport
              currentWord={currentWord}
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
        {/*
          Set VITE_GOATCOUNTER_SITE_CODE in your .env to enable the analytics link.
        */}
        {import.meta.env.VITE_GOATCOUNTER_SITE_CODE && (
          <>
            <span className="footerSep">·</span>
            <a
              href={`https://${import.meta.env.VITE_GOATCOUNTER_SITE_CODE}.goatcounter.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="analyticsLink"
              title="View site visitor analytics"
            >
              📊 Site Analytics
            </a>
          </>
        )}
      </footer>
    </div>
  );
}
