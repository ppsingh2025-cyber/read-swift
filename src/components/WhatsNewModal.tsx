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
  { icon: '🏃', title: 'PaceRead',               body: 'ReadSwift is now PaceRead. Same app, sharper identity. Read Faster. Understand Better.' },
  { icon: '📍', title: 'Context Below Controls', body: 'The context preview now lives below the playback bar — cleaner reading, easier reference.' },
  { icon: '▸',  title: 'Reading Cursor',         body: 'A small cursor icon marks your exact word in context, mirrored in the top bar.' },
  { icon: '📊', title: 'Session History',        body: 'Full session history with per-session stats and one-tap resume replaces the old file list.' },
  { icon: '⚡', title: 'Custom Mode Updates',    body: 'Edit any custom mode and tap "Update" to save. Name input now sits at the top of Fine-tune.' },
];

interface WhatsNewModalProps {
  onDismiss: () => void;
}

export default function WhatsNewModal({ onDismiss }: WhatsNewModalProps) {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="What's new in PaceRead">
      <div className={styles.card}>

        <div className={styles.header}>
          <span className={styles.badge}>{APP_VERSION}</span>
          <h2 className={styles.title}>What's New</h2>
          <p className={styles.subtitle}>PaceRead just got better</p>
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
