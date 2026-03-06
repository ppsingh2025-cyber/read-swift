/**
 * Settings
 *
 * Collapsible settings panel that exposes:
 *   - Word window size (1 / 2 / 3 / 4 / 5)
 *   - Highlight color picker (persisted in localStorage via ReaderContext)
 *   - Reading orientation (Horizontal / Vertical)
 *   - ORP (Optimal Recognition Point) toggle
 *   - Punctuation pause toggle
 *
 * All changes take effect immediately without reloading.
 */

import { useCallback, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import type { WindowSize, Orientation } from '../context/readerContextDef';
import styles from '../styles/Settings.module.css';

export default function Settings() {
  const {
    windowSize, setWindowSize,
    highlightColor, setHighlightColor,
    orientation, setOrientation,
    orpEnabled, setOrpEnabled,
    punctuationPause, setPunctuationPause,
    focusMarkerEnabled, setFocusMarkerEnabled,
  } = useReaderContext();

  const [open, setOpen] = useState(false);

  const handleWindowSize = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = parseInt(e.target.value, 10) as WindowSize;
      setWindowSize(val);
    },
    [setWindowSize],
  );

  const handleColor = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setHighlightColor(e.target.value);
    },
    [setHighlightColor],
  );

  const handleOrientation = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOrientation(e.target.value as Orientation);
    },
    [setOrientation],
  );

  return (
    <div className={styles.container}>
      <button
        className={styles.toggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="settings-panel"
      >
        ⚙ Settings {open ? '▲' : '▼'}
      </button>

      {open && (
        <div id="settings-panel" className={styles.panel}>
          {/* Window size */}
          <label className={styles.row}>
            <span className={styles.label}>Window size</span>
            <select
              className={styles.select}
              value={windowSize}
              onChange={handleWindowSize}
              aria-label="Number of words shown at once"
            >
              <option value={1}>1 word</option>
              <option value={2}>2 words</option>
              <option value={3}>3 words</option>
              <option value={4}>4 words</option>
              <option value={5}>5 words</option>
            </select>
          </label>

          {/* Highlight color */}
          <label className={styles.row}>
            <span className={styles.label}>Highlight color</span>
            <div className={styles.colorWrapper}>
              <input
                type="color"
                className={styles.colorInput}
                value={highlightColor}
                onChange={handleColor}
                aria-label="Center word highlight color"
              />
              <span className={styles.colorHex}>{highlightColor}</span>
            </div>
          </label>

          {/* Orientation */}
          <label className={styles.row}>
            <span className={styles.label}>Orientation</span>
            <select
              className={styles.select}
              value={orientation}
              onChange={handleOrientation}
              aria-label="Word window orientation"
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </label>

          {/* ORP toggle */}
          <label className={styles.row}>
            <span className={styles.label}>
              ORP highlight
              <span className={styles.hint}> (focal letter)</span>
            </span>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={orpEnabled}
              onChange={(e) => setOrpEnabled(e.target.checked)}
              aria-label="Enable Optimal Recognition Point highlighting"
            />
          </label>

          {/* Focus marker toggle — only meaningful when ORP is enabled */}
          <label className={styles.row}>
            <span className={styles.label}>
              Focus marker
              <span className={styles.hint}> (dot under ORP)</span>
            </span>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={focusMarkerEnabled}
              onChange={(e) => setFocusMarkerEnabled(e.target.checked)}
              aria-label="Show focus marker dot beneath the ORP letter"
            />
          </label>

          {/* Punctuation pause toggle */}
          <label className={styles.row}>
            <span className={styles.label}>
              Punctuation pause
              <span className={styles.hint}> (. ? ! , ;)</span>
            </span>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={punctuationPause}
              onChange={(e) => setPunctuationPause(e.target.checked)}
              aria-label="Pause longer after punctuation"
            />
          </label>
        </div>
      )}
    </div>
  );
}
