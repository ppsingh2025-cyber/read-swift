/**
 * BurgerMenu
 *
 * Hamburger icon (top-left) that opens a slide-in settings drawer.
 *
 * Drawer contains (in order):
 *   • Display: window size, orientation, highlight colour
 *   • Reading features: peripheral fade, ORP, punctuation pause, long-word delay
 *   • Reading History (collapsible, re-uses existing component)
 *   • Links: feedback form
 *   • About: app version, Techscript credit
 *
 * State notes:
 *   - Opens/closes locally (no reading-state side effects).
 *   - All settings write directly to ReaderContext which persists to localStorage.
 *   - Drawer is closed whenever a file is selected from history.
 *   - Theme toggle is in the top bar (ThemeToggle component), not here.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import ReadingHistory from './ReadingHistory';
import type { WindowSize, Orientation, ChunkMode } from '../context/readerContextDef';
import { APP_VERSION } from '../version';
import styles from '../styles/BurgerMenu.module.css';

const FEEDBACK_FORM_URL = 'https://forms.gle/dCBSTs4SjvhmA3Zh6';

interface BurgerMenuProps {
  onFileSelect: (file: File) => void;
}

export default function BurgerMenu({ onFileSelect }: BurgerMenuProps) {
  const [open, setOpen] = useState(false);

  const {
    windowSize, setWindowSize,
    orientation, setOrientation,
    highlightColor, setHighlightColor,
    peripheralFade, setPeripheralFade,
    orpEnabled, setOrpEnabled,
    punctuationPause, setPunctuationPause,
    longWordCompensation, setLongWordCompensation,
    mainWordFontSize, setMainWordFontSize,
    chunkMode, setChunkMode,
  } = useReaderContext();

  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, close]);

  // Trap focus inside panel when open (accessibility)
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  // Wrap file select so the menu closes when a history item triggers re-load
  const handleHistoryFileSelect = useCallback(
    (file: File) => {
      close();
      onFileSelect(file);
    },
    [close, onFileSelect],
  );

  return (
    <>
      {/* Hamburger button */}
      <button
        className={styles.burgerBtn}
        onClick={() => setOpen(true)}
        aria-label="Open settings menu"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </button>

      {open && (
        /* Backdrop */
        <div className={styles.backdrop} onClick={close} aria-hidden="true">
          {/* Drawer — stop propagation so clicks inside don't close */}
          <div
            ref={panelRef}
            className={styles.panel}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Settings menu"
            tabIndex={-1}
          >
            {/* ── Drawer header ───────────────────────────────── */}
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>ReadSwift</span>
              <button
                className={styles.closeBtn}
                onClick={close}
                aria-label="Close settings menu"
              >
                ✕
              </button>
            </div>

            <div className={styles.drawerBody}>

              {/* ── Display ────────────────────────────────────────── */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Display</h3>

                <label className={styles.row}>
                  <span className={styles.label}>Window size</span>
                  <select
                    className={styles.select}
                    value={windowSize}
                    onChange={(e) => setWindowSize(parseInt(e.target.value, 10) as WindowSize)}
                    aria-label="Number of words shown at once"
                  >
                    <option value={1}>1 word</option>
                    <option value={2}>2 words</option>
                    <option value={3}>3 words</option>
                    <option value={4}>4 words</option>
                    <option value={5}>5 words</option>
                  </select>
                </label>

                <label className={styles.row}>
                  <span className={styles.label}>Orientation</span>
                  <select
                    className={styles.select}
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as Orientation)}
                    aria-label="Word window orientation"
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </label>

                <label className={styles.row}>
                  <span className={styles.label}>Highlight colour</span>
                  <div className={styles.colorWrapper}>
                    <input
                      type="color"
                      className={styles.colorInput}
                      value={highlightColor}
                      onChange={(e) => setHighlightColor(e.target.value)}
                      aria-label="Center word highlight colour"
                    />
                    <span className={styles.colorHex}>{highlightColor}</span>
                  </div>
                </label>

                <label className={styles.row}>
                  <span className={styles.label}>
                    Main word size
                    <span className={styles.hint}> (ORP word)</span>
                  </span>
                  <select
                    className={styles.select}
                    value={mainWordFontSize}
                    onChange={(e) => setMainWordFontSize(parseInt(e.target.value, 10))}
                    aria-label="Main word font size"
                  >
                    <option value={70}>Small (70%)</option>
                    <option value={85}>Medium (85%)</option>
                    <option value={100}>Normal (100%)</option>
                    <option value={120}>Large (120%)</option>
                    <option value={150}>Extra Large (150%)</option>
                    <option value={180}>Huge (180%)</option>
                  </select>
                </label>
              </section>

              {/* ── Reading features ───────────────────────────── */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Reading Features</h3>

                <label className={styles.row}>
                  <span className={styles.label}>
                    Peripheral fade
                    <span className={styles.hint}> (dim side words)</span>
                  </span>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={peripheralFade}
                    onChange={(e) => setPeripheralFade(e.target.checked)}
                    aria-label="Dim peripheral words for sharper focus"
                  />
                </label>

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

                <label className={styles.row}>
                  <span className={styles.label}>
                    Long-word delay
                    <span className={styles.hint}> ({'>'}8 chars)</span>
                  </span>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={longWordCompensation}
                    onChange={(e) => setLongWordCompensation(e.target.checked)}
                    aria-label="Extra display time for long words"
                  />
                </label>

                <label className={styles.row}>
                  <span className={styles.label}>
                    Chunk mode
                    <span className={styles.hint}> (phrase grouping)</span>
                  </span>
                  <select
                    className={styles.select}
                    value={chunkMode}
                    onChange={(e) => setChunkMode(e.target.value as ChunkMode)}
                    aria-label="Word chunking mode"
                  >
                    <option value="fixed">Fixed window</option>
                    <option value="intelligent">Intelligent phrases</option>
                  </select>
                </label>
              </section>

              {/* ── Reading History ─────────────────────────────── */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Reading History</h3>
                <ReadingHistory onFileSelect={handleHistoryFileSelect} />
              </section>

              {/* ── Links ───────────────────────────────────────── */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>More</h3>
                <a
                  href={FEEDBACK_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkBtn}
                >
                  💬 Send Feedback
                </a>
              </section>

              {/* ── About ───────────────────────────────────────── */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>About</h3>
                <p className={styles.aboutText}>
                  ReadSwift {APP_VERSION}
                </p>
                <p className={styles.aboutText}>
                  Powered by{' '}
                  <a
                    href="https://www.techscript.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.aboutLink}
                  >
                    Techscript
                  </a>
                </p>
              </section>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
