/**
 * App — v1.1.0
 *
 * Root component. 4-layer layout:
 *   1. Top bar  — burger menu (left) · brand (center) · ? help (right)
 *   2. Reading main — viewport (with built-in context strip)
 *   3. (nav layer removed — page nav moved into viewport)
 *   4. Bottom bar — Controls (sticky, always visible)
 *
 * PasteSheet and HelpSheet replace the old InputPanel/HelpModal patterns.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import OnboardingOverlay from './components/OnboardingOverlay';
import { useReaderContext } from './context/useReaderContext';
import { useRSVPEngine } from './hooks/useRSVPEngine';
import { useChunkEngine } from './hooks/useChunkEngine';
import { useAdaptiveSpeed } from './hooks/useAdaptiveSpeed';
import ReaderViewport from './components/ReaderViewport';
import Controls from './components/Controls';
import { PasteSheet } from './components/PasteSheet';
import { HelpSheet } from './components/HelpSheet';
import BurgerMenu from './components/BurgerMenu';
import AppFooter from './components/AppFooter';
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

const MAX_FILE_SIZE = 100 * 1024 * 1024;
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
    orpColored,
    peripheralFade,
    theme,
    mainWordFontSize,
    chunkMode,
    focalLine,
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
    setWpm,
  } = useReaderContext();

  const { wordWindow, play, pause, reset, faster, slower, prevWord, nextWord } = useRSVPEngine();
  const highlightIndex = 0;

  const { chunkWindow, chunkHighlightIndex } = useChunkEngine(
    words, currentWordIndex, windowSize, chunkMode, wordWindow, highlightIndex,
  );

  const { finalizeSession } = useAdaptiveSpeed(currentWordIndex, words.length, isPlaying);
  const manualWpmRef = useRef(false);

  // Check if user is new (no onboarding complete + no words loaded yet)
  const isNewUser = !localStorage.getItem('fastread_onboarding_complete');

  const [helpOpen, setHelpOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(isNewUser);
  const [isFocused, setIsFocused] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('fastread_onboarding_complete'),
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isPlaying && words.length > 0 && fileMetadata) {
      const newBaseline = finalizeSession(wpm);
      if (!manualWpmRef.current && newBaseline !== wpm) setWpm(newBaseline);
      manualWpmRef.current = false;
      const meta = records.find(r => r.name === fileMetadata.name);
      if (meta) {
        const updated = saveRecord({ ...meta, lastWordIndex: currentWordIndex, lastReadAt: new Date().toISOString(), wpm });
        setRecords(updated);
      }
      setSessionCompleted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const finaliseWords = useCallback(
    (allWords: string[], sourceName: string, breaks: number[] = [], rawLines?: string[]) => {
      if (allWords.length === 0) { alert('No readable text found.'); return; }
      setWords(allWords);
      setPageBreaks(breaks);
      setFileId(sourceName);
      resetSessionStats();
      const sMap = rawLines && rawLines.length > 0
        ? buildStructureMap(rawLines, allWords)
        : buildStructureMapFromWords(allWords);
      setStructureMap(sMap);
      const existing = records.find(r => r.name === sourceName);
      const restoredIndex = existing && existing.lastWordIndex >= 0 && existing.lastWordIndex < allWords.length
        ? existing.lastWordIndex : 0;
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
        alert(`File is too large (max 100 MB). Selected file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`);
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!STREAMING_EXTS.has(ext) && !TEXT_EXTS.has(ext)) {
        alert('Unsupported file type. Supported formats: PDF, EPUB, TXT, MD, HTML, RTF, SRT, DOCX.');
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
          const rawPages: string[] = [];
          for await (const pageText of parsePDF(file, p => setLoadingProgress(Math.round(p.percent * 0.8)))) {
            rawPages.push(pageText);
          }
          const { normalizedPages, stats } = normalizePages(rawPages, import.meta.env.DEV);
          if (import.meta.env.DEV) console.debug('[ingestion] PDF normalization stats:', stats);
          setLoadingProgress(90);
          for (const pageText of normalizedPages) {
            breaks.push(allWords.length);
            allRawLines.push(...pageText.split('\n'));
            allWords.push(...tokenize(normalizeText(pageText)));
          }
        } else if (ext === 'epub') {
          const rawPages: string[] = [];
          for await (const chapterText of parseEPUB(file, p => setLoadingProgress(Math.round(p.percent * 0.8)))) {
            rawPages.push(chapterText);
          }
          const { normalizedPages, stats } = normalizePages(rawPages, import.meta.env.DEV);
          if (import.meta.env.DEV) console.debug('[ingestion] EPUB normalization stats:', stats);
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
        alert(err instanceof Error ? err.message : 'Failed to parse the file. Please try a different file.');
      } finally {
        setIsLoading(false);
        setLoadingProgress(100);
      }
    },
    [setIsPlaying, setIsLoading, setLoadingProgress, setFileMetadata, finaliseWords],
  );

  /** Called by PasteSheet — loads text but does NOT auto-play */
  const handlePasteStart = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setFileMetadata({ name: 'Pasted text', size: 0, type: 'text' });
      const parsed = tokenize(normalizeText(trimmed));
      finaliseWords(parsed, 'Pasted text', [], undefined);
    },
    [setFileMetadata, finaliseWords],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHelpOpen(false);
        setIsFocused(false);
        setPasteOpen(false);
        return;
      }
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'button' || tag === 'select' || tag === 'textarea') return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isPlaying) pause(); else play();
          break;
        case 'ArrowUp':
          e.preventDefault();
          manualWpmRef.current = true;
          faster();
          break;
        case 'ArrowDown':
          e.preventDefault();
          manualWpmRef.current = true;
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

  const toggleFocus = useCallback(() => setIsFocused(f => !f), []);
  const completeOnboarding = useCallback(() => {
    localStorage.setItem('fastread_onboarding_complete', 'true');
    setShowOnboarding(false);
  }, []);

  return (
    <AuthProvider>
      {showOnboarding && <OnboardingOverlay onComplete={completeOnboarding} />}
      <div className={`appShell${isFocused ? ' appShellFocused' : ''}`}>

        {/* ── 1. Top bar ──────────────────────────────────────────── */}
        <header className="topBar">
          <div className="topBarLeft">
            <BurgerMenu onFileSelect={handleFileSelect} />
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
              className={`helpBtn${showPulse ? ' helpPulse' : ''}`}
              onClick={() => { setShowPulse(false); setHelpOpen(true); }}
              aria-label="How to use ReadSwift"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </button>
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
              orpColored={orpColored}
              peripheralFade={peripheralFade}
              isLoading={isLoading}
              loadingProgress={loadingProgress}
              hasWords={words.length > 0}
              fullHeight={isFocused}
              mainWordFontSize={mainWordFontSize}
              onFileSelect={handleFileSelect}
              onShowPaste={() => setPasteOpen(true)}
              focalLine={focalLine}
              words={words}
            />
            <button
              className={`maximizeBtn${isFocused ? ' maximizeBtnVisible' : ''}`}
              onClick={toggleFocus}
              title={isFocused ? 'Exit focus mode (Esc)' : 'Enter focus mode'}
              aria-label={isFocused ? 'Exit focus mode' : 'Enter focus mode'}
            >
              {isFocused ? '⊡' : '⊞'}
            </button>
          </div>
        </main>

        {/* ── 4. Bottom control bar (always visible) ──────────────── */}
        <div className="controlsBar">
          <Controls
            onFileSelect={handleFileSelect}
            onPlay={play}
            onPause={pause}
            onReset={reset}
            onPrevWord={prevWord}
            onNextWord={nextWord}
            onPasteClick={() => setPasteOpen(true)}
          />
        </div>

        {/* ── Sheets ──────────────────────────────────────────────── */}
        <PasteSheet isOpen={pasteOpen} onClose={() => setPasteOpen(false)} onStartReading={handlePasteStart} />
        <HelpSheet isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

        <SignInPrompt sessionCompleted={sessionCompleted} onDismiss={() => setSessionCompleted(false)} />
        <Toaster position="bottom-center" />

        {!isFocused && <AppFooter />}
      </div>
    </AuthProvider>
  );
}
