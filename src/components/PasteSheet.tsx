import { useState, useRef, useEffect } from 'react';
import styles from './PasteSheet.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStartReading: (t: string) => void;
}

export const PasteSheet = ({ isOpen, onClose, onStartReading }: Props) => {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => ref.current?.focus(), 280);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleClose = () => {
    setText('');
    onClose();
  };

  const wc = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <span className={styles.title}>Paste Text</span>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">✕</button>
        </div>
        <textarea
          ref={ref}
          className={styles.textarea}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste or type your text here…"
          spellCheck={false}
          autoCorrect="off"
        />
        <div className={styles.footer}>
          <span className={styles.wc}>{wc > 0 ? `${wc.toLocaleString()} words` : ''}</span>
          <button
            className={styles.startBtn}
            onClick={() => { if (text.trim()) { onStartReading(text.trim()); handleClose(); } }}
            disabled={wc === 0}
          >
            Start Reading →
          </button>
        </div>
      </div>
    </div>
  );
};
