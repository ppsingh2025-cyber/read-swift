/**
 * InputPanel v3 — text paste only.
 *
 * No URL mode. No tabs. Single textarea.
 * Clipboard auto-fills on open if permission granted.
 * Shows live word count + reading time estimate.
 * 100 MB text limit (enforced by character count).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { parseRawText } from '../parsers/textParser';
import styles from '../styles/InputPanel.module.css';

const MAX_CHARS = 100 * 1024 * 1024; // ~100 M characters (practical upper limit for pasted text)
const MIN_CLIPBOARD_LENGTH = 20;    // minimum chars to trigger clipboard auto-fill

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatTime(minutes: number): string {
  if (minutes < 1)  return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

interface InputPanelProps {
  onTextReady: (words: string[], sourceName: string, rawLines?: string[]) => void;
  onClose?: () => void;
  wpm?: number;
}

export default function InputPanel({ onTextReady, onClose, wpm = 250 }: InputPanelProps) {
  const [value,        setValue]        = useState('');
  const [error,        setError]        = useState<string | null>(null);
  const [clipboardHit, setClipboardHit] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Clipboard auto-fill on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (cancelled || text.trim().length < MIN_CLIPBOARD_LENGTH) return;
        setValue(text.slice(0, MAX_CHARS));
        setClipboardHit(true);
        textareaRef.current?.select();
      } catch {
        // Permission denied or API unavailable — silent fail
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const trimmed   = value.trim();
  const wordCount = countWords(trimmed);
  const hasContent = trimmed.length > 0;
  const readingMin = wpm > 0 && wordCount > 0 ? wordCount / wpm : 0;

  const handleSubmit = useCallback(() => {
    setError(null);
    if (!hasContent) {
      setError('Paste some text to get started.');
      textareaRef.current?.focus();
      return;
    }
    const isUrl = /^https?:\/\/\S+$/i.test(trimmed) || /^www\.\S+\.\S+$/i.test(trimmed);
    if (isUrl) {
      setError("URLs aren't supported — paste the article text directly instead.");
      return;
    }
    const { words, rawLines } = parseRawText(trimmed, 'paste');
    if (words.length === 0) {
      setError('No readable words found in the pasted text.');
      return;
    }
    onTextReady(words, 'Pasted text', rawLines);
    setValue('');
    onClose?.();
  }, [trimmed, hasContent, onTextReady, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className={styles.panel}>

      {/* Clipboard notice */}
      {clipboardHit && (
        <div className={styles.clipBanner}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round"
               strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="2" width="6" height="4" rx="1"/>
            <path d="M9 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2"/>
          </svg>
          Clipboard text pasted automatically
          <button
            className={styles.clipDismiss}
            onClick={() => setClipboardHit(false)}
            aria-label="Dismiss"
          >✕</button>
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        placeholder="Paste your article, book excerpt, or any text here… (up to 100 MB)"
        value={value}
        onChange={e => {
          setValue(e.target.value.slice(0, MAX_CHARS));
          setError(null);
          setClipboardHit(false);
        }}
        onKeyDown={handleKeyDown}
        rows={4}
        aria-label="Text to read"
        spellCheck={false}
        autoFocus={!clipboardHit}
      />

      {/* Footer: metadata + CTA */}
      <div className={styles.footer}>
        <div className={styles.meta}>
          {wordCount > 0 ? (
            <>
              <span className={styles.chip}>{wordCount.toLocaleString()} words</span>
              {readingMin > 0 && (
                <span className={styles.chip}>~{formatTime(readingMin)} at {wpm} WPM</span>
              )}
            </>
          ) : (
            <span className={styles.hint}>Ctrl+Enter to load</span>
          )}
        </div>
        <button
          className={styles.cta}
          onClick={handleSubmit}
          disabled={!hasContent}
        >
          Start Reading →
        </button>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}

