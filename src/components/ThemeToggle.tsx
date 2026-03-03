/**
 * ThemeToggle
 *
 * A small sun/moon icon button in the top-right corner of the top bar.
 * Immediately toggles between Night and Day mode with no page reload.
 * Theme preference is persisted to localStorage via ReaderContext.
 */

import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, setTheme } = useReaderContext();
  const isNight = theme === 'night';

  return (
    <button
      className={styles.toggleBtn}
      onClick={() => setTheme(isNight ? 'day' : 'night')}
      aria-label={isNight ? 'Switch to Day mode' : 'Switch to Night mode'}
      title={isNight ? 'Switch to Day mode' : 'Switch to Night mode'}
    >
      {isNight ? '☀' : '🌙'}
    </button>
  );
}
