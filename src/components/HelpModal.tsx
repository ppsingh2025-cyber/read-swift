/**
 * HelpModal — "How to Use"
 *
 * Step-by-step guide written from the user's perspective.
 * Tone: clear, direct, action-oriented.
 */

import styles from '../styles/HelpModal.module.css';

interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    /* Backdrop — click outside to close */
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="How to Use ReadSwift">
        <div className={styles.header}>
          <h2 className={styles.title}>📖 How to Use ReadSwift</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close help">✕</button>
        </div>

        <div className={styles.body}>

          {/* ── Load content ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>1. Upload or Paste Content</h3>
            <ul className={styles.featureList}>
              <li>Click <strong>📂 Upload File</strong> to open a PDF, EPUB, TXT, MD, HTML, RTF, SRT, or DOCX (up to 100 MB).</li>
              <li>Click <strong>📋 Paste / URL</strong> to paste text directly or enter a web URL to fetch an article.</li>
              <li>Click a title in <strong>Reading History</strong> to resume exactly where you left off.</li>
            </ul>
          </section>

          {/* ── Adjust speed ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>2. Adjust Reading Speed</h3>
            <ul className={styles.featureList}>
              <li>Drag the <strong>speed slider</strong> or click <kbd>−</kbd> / <kbd>+</kbd> to change WPM (60 – 1500).</li>
              <li>Start at <strong>200 – 300 WPM</strong> and increase gradually each session.</li>
              <li>Use keyboard: <kbd>↑</kbd> to go faster, <kbd>↓</kbd> to go slower.</li>
            </ul>
          </section>

          {/* ── Play ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>3. Start Reading</h3>
            <ul className={styles.featureList}>
              <li>Press <strong>▶ Play</strong> or tap <kbd>Space</kbd> to begin.</li>
              <li>Press <kbd>Space</kbd> again, click <strong>⏸</strong>, or tap the reading area to pause. Your position is saved automatically.</li>
              <li>Click <strong>↩</strong> to restart from the beginning at any time.</li>
            </ul>
          </section>

          {/* ── Navigate ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>4. Navigate Pages or Words</h3>
            <ul className={styles.featureList}>
              <li>Use <kbd>←</kbd> / <kbd>→</kbd> to step word by word, or click <strong>‹ ›</strong> in the controls.</li>
              <li>Click the <strong>progress bar</strong> to jump to any position in the text.</li>
              <li>Click the <strong>word counter</strong> (e.g. <em>42 / 3000</em>), type a number, and press <kbd>Enter</kbd> to jump directly.</li>
              <li>For PDFs and EPUBs, use the <strong>page/chapter navigator</strong> to jump to any section.</li>
            </ul>
          </section>

          {/* ── Customize ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>5. Customize the Display</h3>
            <ul className={styles.featureList}>
              <li>Open the <strong>☰ menu</strong> to adjust window size (1 – 5 words), orientation, and highlight colour.</li>
              <li>Use <strong>Window size</strong> to read 1, 2, 3, 4, or 5 words at once — higher counts give more context per flash, lower counts maximise focus. Default is 2 words.</li>
              <li>Enable <strong>ORP</strong> to highlight the focal letter in each word and guide your eye.</li>
              <li>Enable <strong>Punctuation pause</strong> to add natural pauses after sentence-ending marks.</li>
              <li>Click the <strong>☀</strong> (Day) or <strong>🌙</strong> (Night) button in the top-right corner to toggle between Day and Night mode. The app logo beside the title also switches automatically to match the selected theme — no page reload needed.</li>
              <li>Click <strong>⊞</strong> on the viewport to enter focus mode for distraction-free reading.</li>
            </ul>
          </section>

          {/* ── History ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>6. Resume from Reading History</h3>
            <ul className={styles.featureList}>
              <li>Every document you read is saved automatically with your last position, word count, and date.</li>
              <li>Open <strong>Reading History</strong> in the menu, then click <strong>↩ Resume</strong> next to a title.</li>
              <li>Re-upload the file when prompted — ReadSwift will restore your exact position.</li>
            </ul>
          </section>

          {/* ── Shortcuts ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>⌨ Keyboard Shortcuts</h3>
            <table className={styles.shortcutTable}>
              <tbody>
                <tr><td><kbd>Space</kbd></td><td>Play / Pause</td></tr>
                <tr><td><kbd>←</kbd></td><td>Previous word</td></tr>
                <tr><td><kbd>→</kbd></td><td>Next word</td></tr>
                <tr><td><kbd>↑</kbd></td><td>Increase speed (×1.2)</td></tr>
                <tr><td><kbd>↓</kbd></td><td>Decrease speed (÷1.2)</td></tr>
                <tr><td><kbd>Esc</kbd></td><td>Close panels / exit focus</td></tr>
              </tbody>
            </table>
            <p className={styles.note}>Shortcuts are disabled when a text input or button is focused.</p>
          </section>

        </div>
      </div>
    </div>
  );
}

