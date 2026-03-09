/**
 * WhatsNewModal — shown once per app version.
 * Appears before onboarding on version bumps.
 */

import { APP_VERSION } from '../version';
import styles from '../styles/WhatsNewModal.module.css';

interface WhatsNewEntry {
  icon: string;
  title: string;
  body: string;
}

const WHATS_NEW: WhatsNewEntry[] = [
  { icon: '📖', title: 'Context Window Scrollable', body: 'The page context panel now scrolls within the available screen space and uses real document page numbers.' },
  { icon: '⚡', title: 'Preset WPM Fixed',          body: 'Sprint, Focus, and Flow modes now apply correct default speeds (450 / 250 / 180 WPM) when first selected.' },
  { icon: '📊', title: 'Session History',            body: 'Session analytics now tracks and stores your past reading sessions with per-session stats and history.' },
  { icon: '🖐️', title: '5-Word Window',              body: 'The rolling word window now supports up to 5 words for broader context reading.' },
  { icon: '🎨', title: 'Theme Preview in Setup',     body: 'Picking a theme or mode in the setup wizard now updates the app immediately as you choose.' },
];

interface WhatsNewModalProps {
  onDismiss: () => void;
}

export default function WhatsNewModal({ onDismiss }: WhatsNewModalProps) {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="What's new in ReadSwift">
      <div className={styles.card}>

        <div className={styles.header}>
          <span className={styles.badge}>{APP_VERSION}</span>
          <h2 className={styles.title}>What's New</h2>
          <p className={styles.subtitle}>ReadSwift just got better</p>
        </div>

        <ul className={styles.list} role="list">
          {WHATS_NEW.map((entry) => (
            <li key={entry.title} className={styles.item}>
              <span className={styles.icon} aria-hidden="true">{entry.icon}</span>
              <div className={styles.text}>
                <span className={styles.itemTitle}>{entry.title}</span>
                <span className={styles.itemBody}>{entry.body}</span>
              </div>
            </li>
          ))}
        </ul>

        <button type="button" className={styles.cta} onClick={onDismiss} autoFocus>
          Got it — let's read
        </button>

      </div>
    </div>
  );
}
