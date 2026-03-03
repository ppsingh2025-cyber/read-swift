/**
 * AppFooter
 *
 * Minimal, non-distracting footer showing:
 *   - "Buy Me a Coffee" support link
 *   - "Powered by Techscript"
 */

import styles from '../styles/AppFooter.module.css';

export default function AppFooter() {
  return (
    <footer className={styles.footer}>
      <a
        href="https://buymeacoffee.com/techscriptx"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
        aria-label="Buy me a coffee — support ReadSwift"
        title="Support ReadSwift — all features stay free"
      >
        ☕ Buy me a coffee
      </a>
      <span className={styles.sep}>·</span>
      <a
        href="https://www.techscript.ca"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        Powered by Techscript
      </a>
    </footer>
  );
}
