/**
 * ThemeToggle
 *
 * A small icon button in the top bar that cycles through the 3 app themes:
 * Midnight → Warm → Day → Midnight …
 *
 * Full theme control is also available in the burger menu.
 */

import { useReaderContext } from '../context/useReaderContext';
import type { Theme } from '../context/readerContextDef';
import styles from '../styles/ThemeToggle.module.css';

const THEME_CYCLE: Theme[] = ['midnight', 'warm', 'day'];
const THEME_ICONS: Record<Theme, string> = {
  midnight: '🌙',
  warm: '🕯',
  day: '☀',
};
const THEME_LABELS: Record<Theme, string> = {
  midnight: 'Switch to Warm theme',
  warm: 'Switch to Day theme',
  day: 'Switch to Midnight theme',
};

export default function ThemeToggle() {
  const { theme, setTheme } = useReaderContext();

  const handleClick = () => {
    const idx = THEME_CYCLE.indexOf(theme);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    setTheme(next);
  };

  return (
    <button
      className={styles.toggleBtn}
      onClick={handleClick}
      aria-label={THEME_LABELS[theme] ?? 'Switch theme'}
      title={THEME_LABELS[theme] ?? 'Switch theme'}
    >
      {THEME_ICONS[theme] ?? '🌙'}
    </button>
  );
}
