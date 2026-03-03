/**
 * HelpModal
 *
 * Full-featured help overlay listing every ReadSwift feature and providing
 * a step-by-step guide on how to use the app.
 */

import styles from '../styles/HelpModal.module.css';

interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    /* Backdrop — click outside to close */
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Help & Features">
        <div className={styles.header}>
          <h2 className={styles.title}>📖 ReadSwift — Help & Features</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close help">✕</button>
        </div>

        <div className={styles.body}>

          {/* ── What is ReadSwift ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>What is ReadSwift?</h3>
            <p>
              ReadSwift is a <strong>Rapid Serial Visual Presentation (RSVP)</strong> speed reader.
              Words are flashed one-at-a-time (or in groups of 3 / 5) at the centre of your screen.
              Because your eyes don't need to scan lines, you can read significantly faster with
              the same or better comprehension.
            </p>
          </section>

          {/* ── Step-by-step guide ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>🚀 Getting Started — Step by Step</h3>
            <ol className={styles.steps}>
              <li>
                <strong>Load content</strong> — choose one of three ways:
                <ul>
                  <li>📂 Click the <em>Upload</em> button and pick a PDF, EPUB, TXT, MD, HTML, RTF, SRT, or DOCX file (up to 100 MB).</li>
                  <li>📋 Expand the <em>Text / URL</em> panel, paste any text, or enter a web URL to fetch the article.</li>
                  <li>🕐 Click a title in the <em>Reading History</em> panel to resume where you left off.</li>
                </ul>
              </li>
              <li>
                <strong>Set your speed</strong> — drag the speed slider (60 – 1500 WPM) or
                click <kbd>−</kbd> / <kbd>+</kbd> to step by 20 %. The default is 250 WPM,
                a comfortable starting point for most readers. Build up gradually.
              </li>
              <li>
                <strong>Start reading</strong> — press the <em>▶ Play</em> button or tap
                <kbd>Space</kbd>. The centre word is highlighted in your chosen colour.
              </li>
              <li>
                <strong>Pause / resume</strong> — press <kbd>Space</kbd>, click <em>⏸</em>, or just
                tap the viewport. Your position is saved automatically.
              </li>
              <li>
                <strong>Navigate</strong> — use <kbd>←</kbd> / <kbd>→</kbd> to step word-by-word,
                or click the progress bar to jump to any position. The word counter (e.g. <em>42 / 3000</em>)
                is also clickable — type the target word number and press <kbd>Enter</kbd>.
              </li>
              <li>
                <strong>Adjust settings</strong> — expand the <em>⚙ Settings</em> panel to change
                window size, highlight colour, layout orientation, ORP, and punctuation pause.
              </li>
            </ol>
          </section>

          {/* ── Feature list ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>✨ Full Feature List</h3>

            <h4 className={styles.subTitle}>Reading Engine</h4>
            <ul className={styles.featureList}>
              <li><strong>RSVP word display</strong> — flashes words at configurable WPM (60 – 1500).</li>
              <li><strong>Rolling window</strong> — show 1, 3, or 5 words at once for context without losing your place.</li>
              <li><strong>Fixed focal anchor</strong> — the centre word <em>never</em> shifts horizontally regardless of word length. Each slot uses a fixed-width grid column.</li>
              <li><strong>Optimal Recognition Point (ORP)</strong> — optionally highlights the letter ~20 % from the left of the centre word (the natural fixation point) to guide your eye to the exact focal location, just like professional RSVP tools.</li>
              <li><strong>Punctuation pause</strong> — automatically lengthens the display time after periods, question marks, exclamation marks (+40 %) and commas/semicolons (+20 %) so sentence boundaries feel natural.</li>
              <li><strong>Long-word compensation</strong> — words longer than 8 characters get a small extra display time proportional to their excess length, preventing missed words at high speeds.</li>
              <li><strong>rAF-based timing</strong> — uses <em>requestAnimationFrame</em> with delta-based scheduling instead of <em>setInterval</em>, eliminating timer drift at speeds above 600 WPM.</li>
            </ul>

            <h4 className={styles.subTitle}>Navigation</h4>
            <ul className={styles.featureList}>
              <li><strong>Progress bar</strong> — click anywhere to jump to that percentage of the text.</li>
              <li><strong>Word counter</strong> — click to enter an exact word number and jump instantly.</li>
              <li><strong>Page / chapter navigator</strong> — for PDFs and EPUBs, jump directly to any page or chapter.</li>
              <li><strong>Word navigator</strong> — step backward/forward one word at a time.</li>
              <li><strong>Auto-resume</strong> — your last position is saved in localStorage and restored when you reload the page or re-open a file from history.</li>
            </ul>

            <h4 className={styles.subTitle}>File Support</h4>
            <ul className={styles.featureList}>
              <li>PDF (with per-page streaming progress)</li>
              <li>EPUB (per-chapter streaming)</li>
              <li>TXT, Markdown (.md), HTML, RTF, SRT subtitles, DOCX</li>
              <li>Paste plain text directly into the text panel</li>
              <li>Fetch &amp; read any public web URL (article extraction)</li>
              <li>Up to 100 MB file size limit</li>
            </ul>

            <h4 className={styles.subTitle}>Display &amp; Themes</h4>
            <ul className={styles.featureList}>
              <li><strong>Night mode</strong> (default) — near-black background with soft light text to minimise eye strain.</li>
              <li><strong>Day mode</strong> — warm light background with dark text for bright environments. Toggle with the 🌙 / ☀ button in the header.</li>
              <li><strong>Highlight colour</strong> — pick any colour for the centre word via the colour picker in Settings.</li>
              <li><strong>Orientation</strong> — display words horizontally (default) or stacked vertically.</li>
              <li>Theme choice, speed, window size, highlight colour, and orientation are all persisted in localStorage.</li>
            </ul>

            <h4 className={styles.subTitle}>Context Preview</h4>
            <ul className={styles.featureList}>
              <li>A sidebar panel shows a wider excerpt around your current position so you can re-read context without interrupting playback.</li>
            </ul>

            <h4 className={styles.subTitle}>Reading History</h4>
            <ul className={styles.featureList}>
              <li>Automatically records every file / URL you read, including word count, last position, date, and reading speed.</li>
              <li>Click any history entry to resume exactly where you left off.</li>
            </ul>
          </section>

          {/* ── Keyboard shortcuts ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>⌨ Keyboard Shortcuts</h3>
            <table className={styles.shortcutTable}>
              <tbody>
                <tr><td><kbd>Space</kbd></td><td>Play / Pause</td></tr>
                <tr><td><kbd>←</kbd></td><td>Previous word</td></tr>
                <tr><td><kbd>→</kbd></td><td>Next word</td></tr>
                <tr><td><kbd>↑</kbd></td><td>Increase speed (×1.2)</td></tr>
                <tr><td><kbd>↓</kbd></td><td>Decrease speed (÷1.2)</td></tr>
              </tbody>
            </table>
            <p className={styles.note}>Shortcuts are disabled when a text input or button is focused.</p>
          </section>

          {/* ── Tips ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>💡 Tips for Best Results</h3>
            <ul className={styles.featureList}>
              <li>Start at <strong>200 – 300 WPM</strong> and increase by 50 WPM each session as you get comfortable.</li>
              <li>Use the <strong>3-word window</strong> — it provides just enough context to maintain comprehension without overwhelming your field of view.</li>
              <li>Enable <strong>ORP</strong> if you find your eyes wandering; the highlighted focal letter anchors your gaze precisely.</li>
              <li>Enable <strong>Punctuation Pause</strong> to make sentence boundaries feel natural at higher speeds.</li>
              <li>For long documents, use the <strong>Chapter/Page navigator</strong> to jump to specific sections.</li>
              <li>Switch to <strong>Day mode</strong> in bright rooms and <strong>Night mode</strong> in dim environments.</li>
              <li>Resize the browser window — all layouts adapt responsively down to mobile width.</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
