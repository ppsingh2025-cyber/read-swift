/**
 * DonateButton
 *
 * A small, non-intrusive "☕ Buy me a coffee" link in the app header.
 * Opens the Buy Me a Coffee page in a new tab.
 * All core features remain free — this is purely optional support.
 */

import styles from '../styles/DonateButton.module.css';

export default function DonateButton() {
  return (
    <a
      href="https://buymeacoffee.com/techscriptx"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.supportBtn}
      aria-label="Buy me a coffee — support PaceRead"
      title="Support PaceRead — all features stay free"
    >
      ☕ Buy me a coffee
    </a>
  );
}
