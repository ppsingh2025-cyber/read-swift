/**
 * InputPanel
 *
 * Paste Text input mode: user pastes article/book text directly.
 * Calls the `onTextReady` callback with the extracted words array
 * so it plugs directly into the same parsing pipeline as file uploads.
 */

import { useCallback, useState } from 'react';
import { parseRawText } from '../parsers/textParser';
import styles from '../styles/InputPanel.module.css';

interface InputPanelProps {
  /** Called when text has been extracted and is ready for the reading engine */
  onTextReady: (words: string[], sourceName: string, rawLines?: string[]) => void;
}

export default function InputPanel({ onTextReady }: InputPanelProps) {
  const [pasteValue, setPasteValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePasteSubmit = useCallback(() => {
    setError(null);
    const trimmed = pasteValue.trim();
    if (!trimmed) {
      setError('Please paste some text before loading.');
      return;
    }
    const { words, rawLines } = parseRawText(trimmed, 'paste');
    if (words.length === 0) {
      setError('No readable words found in the pasted text.');
      return;
    }
    onTextReady(words, 'Pasted text', rawLines);
    setPasteValue('');
  }, [pasteValue, onTextReady]);

  return (
    <div className={styles.panel}>
      <div className={styles.modeBody}>
        <textarea
          className={styles.textarea}
          placeholder="Paste your article, book excerpt, or any text here…"
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
          rows={6}
          aria-label="Paste text to read"
        />
        <button
          className={styles.submitBtn}
          onClick={handlePasteSubmit}
          disabled={!pasteValue.trim()}
        >
          Load text ▶
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
