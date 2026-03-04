/**
 * BurgerMenu
 *
 * Hamburger icon (top-left) that opens a slide-in settings drawer.
 *
 * Drawer contains (in order):
 *   • Reading Profile selector (quick presets)
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
 *   - During active reading (isPlaying), Display and Reading Features sections
 *     are collapsed by default; a "Show Settings" button expands them.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import ReadingHistory from './ReadingHistory';
import SessionStats from './SessionStats';
import type { WindowSize, Orientation, ChunkMode } from '../context/readerContextDef';
import { APP_VERSION } from '../version';
import { IndexedDBService } from '../sync/IndexedDBService';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { useAuth } from '../auth/useAuth';
import { clearAllRecords } from '../utils/recordsUtils';
import toast from 'react-hot-toast';
import styles from '../styles/BurgerMenu.module.css';
import {
  READING_PROFILES,
  DEFAULT_PROFILE_ID,
  LS_KEY_PROFILE,
  type ReadingProfile,
} from '../config/profiles';

const FEEDBACK_FORM_URL = 'https://forms.gle/dCBSTs4SjvhmA3Zh6';

/** Apply the "Balanced" profile on first launch if no profile was previously saved */
function initDefaultProfile(): string {
  if (!localStorage.getItem(LS_KEY_PROFILE)) {
    localStorage.setItem(LS_KEY_PROFILE, DEFAULT_PROFILE_ID);
  }
  return localStorage.getItem(LS_KEY_PROFILE) ?? DEFAULT_PROFILE_ID;
}

// Named preset highlight colours — 10 options
const PRESET_COLORS = [
  { hex: '#e74c3c', name: 'Red' },
  { hex: '#e67e22', name: 'Orange' },
  { hex: '#f1c40f', name: 'Yellow' },
  { hex: '#2ecc71', name: 'Green' },
  { hex: '#1abc9c', name: 'Teal' },
  { hex: '#3498db', name: 'Blue' },
  { hex: '#5856d6', name: 'Indigo' },
  { hex: '#9b59b6', name: 'Purple' },
  { hex: '#e91e8c', name: 'Pink' },
  { hex: '#ffffff', name: 'White' },
] as const;

function getColorName(hex: string): string {
  const found = PRESET_COLORS.find(
    (c) => c.hex.toLowerCase() === hex.toLowerCase(),
  );
  return found ? found.name : 'Custom';
}

// Default preference values (mirrored from ReaderContext)
const DEFAULT_WPM = 250;
const DEFAULT_THEME = 'night' as const;
const DEFAULT_WINDOW_SIZE = 3 as WindowSize;
const DEFAULT_HIGHLIGHT_COLOR = '#ff0000';
const DEFAULT_ORIENTATION = 'horizontal' as Orientation;
const DEFAULT_ORP = false;
const DEFAULT_PUNCT_PAUSE = true;
const DEFAULT_PERIPHERAL_FADE = true;
const DEFAULT_LONG_WORD_COMP = true;
const DEFAULT_MAIN_FONT_SIZE = 100;
const DEFAULT_CHUNK_MODE = 'fixed' as ChunkMode;

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
    setTheme,
    setWpm,
    records,
    setRecords,
    isPlaying,
  } = useReaderContext();

  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [colorExpanded, setColorExpanded] = useState(false);

  // Active profile ID (persisted to localStorage)
  const [activeProfileId, setActiveProfileId] = useState<string>(() => initDefaultProfile());

  // During active reading, advanced settings are collapsed unless user expands them.
  // Resets every time the menu is opened while playing (so re-opening the menu during
  // an active session always starts collapsed).
  const [showAdvancedDuringReading, setShowAdvancedDuringReading] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // Open menu; collapse advanced settings if reading is in progress
  const handleOpen = useCallback(() => {
    if (isPlaying) setShowAdvancedDuringReading(false);
    setOpen(true);
  }, [isPlaying]);

  const close = useCallback(() => setOpen(false), []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };
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

  // Apply a reading profile — updates all relevant settings at once
  const applyProfile = useCallback(
    (profile: ReadingProfile) => {
      setWindowSize(profile.windowSize);
      setOrientation(profile.orientation);
      setHighlightColor(profile.highlightColor);
      setChunkMode(profile.chunkMode);
      setPeripheralFade(profile.peripheralFade);
      setPunctuationPause(profile.punctuationPause);
      setLongWordCompensation(profile.longWordCompensation);
      setMainWordFontSize(profile.mainWordFontSize);
      setWpm(profile.wpm);
      setActiveProfileId(profile.id);
      localStorage.setItem(LS_KEY_PROFILE, profile.id);
      toast.success(`${profile.name} profile applied`);
    },
    [
      setWindowSize, setOrientation, setHighlightColor, setChunkMode,
      setPeripheralFade, setPunctuationPause, setLongWordCompensation,
      setMainWordFontSize, setWpm,
    ],
  );

  // Reset all user preferences to their defaults
  const handleResetDefaults = useCallback(() => {
    setTheme(DEFAULT_THEME);
    setWindowSize(DEFAULT_WINDOW_SIZE);
    setHighlightColor(DEFAULT_HIGHLIGHT_COLOR);
    setOrientation(DEFAULT_ORIENTATION);
    setOrpEnabled(DEFAULT_ORP);
    setPunctuationPause(DEFAULT_PUNCT_PAUSE);
    setPeripheralFade(DEFAULT_PERIPHERAL_FADE);
    setLongWordCompensation(DEFAULT_LONG_WORD_COMP);
    setMainWordFontSize(DEFAULT_MAIN_FONT_SIZE);
    setChunkMode(DEFAULT_CHUNK_MODE);
    setWpm(DEFAULT_WPM);
    setActiveProfileId(DEFAULT_PROFILE_ID);
    localStorage.setItem(LS_KEY_PROFILE, DEFAULT_PROFILE_ID);
    // Clear IndexedDB preferences
    IndexedDBService.savePreferences({
      theme: DEFAULT_THEME,
      fontSize: DEFAULT_MAIN_FONT_SIZE,
      wordWindow: DEFAULT_WINDOW_SIZE,
      highlightColor: DEFAULT_HIGHLIGHT_COLOR,
      updatedAt: new Date(),
    }).catch(() => { /* ignore */ });
    toast.success('Settings reset to defaults');
  }, [setTheme, setWindowSize, setHighlightColor, setOrientation, setOrpEnabled,
      setPunctuationPause, setPeripheralFade, setLongWordCompensation,
      setMainWordFontSize, setChunkMode, setWpm]);

  // Clear all reading history
  const handleClearHistory = useCallback(async () => {
    // Clear localStorage records
    setRecords(clearAllRecords());

    // Clear IndexedDB sessions
    try {
      await IndexedDBService.clearAllSessions();
    } catch { /* ignore IndexedDB errors */ }

    // If signed in, delete from Supabase
    if (isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase.from('reading_sessions').delete().eq('user_id', user.id);
      } catch { /* ignore Supabase errors */ }
    }

    toast.success('Reading history cleared');
  }, [setRecords, user]);

  return (
    <>
      {/* Hamburger button */}
      <button
        className={styles.burgerBtn}
        onClick={handleOpen}
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

              {/* ── Reading Profiles ───────────────────────────────── */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Reading Profile</h3>
                <div className={styles.profileGrid}>
                  {READING_PROFILES.map((profile) => (
                    <button
                      key={profile.id}
                      className={`${styles.profileBtn}${activeProfileId === profile.id ? ` ${styles.profileBtnActive}` : ''}`}
                      onClick={() => applyProfile(profile)}
                      title={profile.description}
                      aria-pressed={activeProfileId === profile.id}
                    >
                      <span className={styles.profileName}>{profile.name}</span>
                      <span className={styles.profileWpm}>{profile.wpm} WPM</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* ── Minimal-UI notice during active reading ─────────── */}
              {isPlaying && !showAdvancedDuringReading && (
                <div className={styles.readingActiveBar}>
                  <span className={styles.readingActiveDot} aria-hidden="true" />
                  <span className={styles.readingActiveLabel}>Reading in progress</span>
                  <button
                    className={styles.showSettingsBtn}
                    onClick={() => setShowAdvancedDuringReading(true)}
                  >
                    Show Settings
                  </button>
                </div>
              )}

              {/* ── Display ────────────────────────────────────────── */}
              {(!isPlaying || showAdvancedDuringReading) && (
              <>
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Display</h3>
                  <button
                    className={styles.sectionActionBtn}
                    onClick={handleResetDefaults}
                    title="Reset to Default Settings"
                    aria-label="Reset to Default Settings"
                  >
                    {/* Refresh / reset icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                  </button>
                </div>

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

                {/* Compact colour picker: circle preview + expandable swatches */}
                <div className={styles.row}>
                  <span className={styles.label}>Highlight colour</span>
                  <button
                    className={styles.colorCircleBtn}
                    style={{ background: highlightColor }}
                    onClick={() => setColorExpanded((v) => !v)}
                    aria-label={`Highlight colour: ${getColorName(highlightColor)}. Click to change.`}
                    aria-expanded={colorExpanded}
                    title={`${getColorName(highlightColor)} — click to change`}
                  />
                </div>
                {colorExpanded && (
                  <div className={styles.colorPalette}>
                    <div className={styles.colorSwatches}>
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          className={`${styles.colorSwatch}${highlightColor.toLowerCase() === c.hex.toLowerCase() ? ` ${styles.colorSwatchActive}` : ''}`}
                          style={{ background: c.hex }}
                          onClick={() => { setHighlightColor(c.hex); setColorExpanded(false); }}
                          title={c.name}
                          aria-label={`Highlight colour: ${c.name}`}
                          aria-pressed={highlightColor.toLowerCase() === c.hex.toLowerCase()}
                        />
                      ))}
                    </div>
                    <div className={styles.customColorRow}>
                      <input
                        type="color"
                        className={styles.customColorInput}
                        value={highlightColor}
                        onChange={(e) => setHighlightColor(e.target.value)}
                        aria-label="Custom highlight colour"
                        title="Custom colour"
                      />
                      <span className={styles.customColorLabel}>Custom colour</span>
                      <span className={styles.customColorHex}>{highlightColor}</span>
                    </div>
                  </div>
                )}

                <label className={styles.row}>
                  <span className={styles.label}>
                    Main word size
                    <span className={styles.hint}> (focus word)</span>
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
              </>) /* end (!isPlaying || showAdvancedDuringReading) */}

              {/* ── Reading History ─────────────────────────────── */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <button
                    className={styles.accordionToggle}
                    onClick={() => setHistoryOpen((v) => !v)}
                    aria-expanded={historyOpen}
                    aria-controls="history-accordion-body"
                  >
                    <h3 className={styles.sectionTitle}>
                      Reading History{records.length > 0 && <span className={styles.sectionCount}> ({records.length})</span>}
                    </h3>
                    <span
                      className={styles.chevron}
                      style={{ transform: historyOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                      aria-hidden="true"
                    >▼</span>
                  </button>
                  {records.length > 0 && (
                  <button
                    className={`${styles.sectionActionBtn} ${styles.sectionActionBtnDanger}`}
                    onClick={handleClearHistory}
                    title="Clear Reading History"
                    aria-label="Clear Reading History"
                  >
                    {/* Trash icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/>
                      <path d="M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                  )}
                </div>
                {historyOpen && (
                  <div id="history-accordion-body">
                    {records.length === 0 ? (
                      <p className={styles.emptyHint}>No reading history yet.</p>
                    ) : (
                      <ReadingHistory onFileSelect={handleHistoryFileSelect} />
                    )}
                  </div>
                )}
              </section>

              {/* ── Session Analytics ───────────────────────────── */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Session Analytics</h3>
                <SessionStats />
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
                <a
                  href={FEEDBACK_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkBtn}
                >
                  💬 Send Feedback
                </a>
              </section>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
