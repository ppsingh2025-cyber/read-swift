/**
 * BurgerMenu — v1.1.0
 *
 * Drawer slides in from LEFT (translateX(-100%) → 0), 88% width, max 360px.
 * 4 sections separated by hairline borders.
 *
 * Section 1 — ⚡ MODES         (4 horizontal mode tabs)
 * Section 2 — 🎨 DISPLAY       (theme · font size · words at once · layout)
 * Section 3 — 👁 READING       (ORP color swatches · 5 toggles)
 * Section 4 — ♿ ACCESSIBILITY (color-blind ORP · break reminder)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import type { PresetModeId } from '../context/readerContextDef';
import { APP_VERSION } from '../version';
import { ORP_COLORS } from '../config/orpColors';
import { PRESET_MODES } from '../config/readingModePresets';
import styles from '../styles/BurgerMenu.module.css';

const FEEDBACK_FORM_URL = 'https://forms.gle/dCBSTs4SjvhmA3Zh6';

const THEME_SWATCHES: Record<'midnight' | 'warm' | 'day', string> = {
  midnight: '#5b8dee',
  warm: '#e8a830',
  day: '#2a7a6e',
};

interface BurgerMenuProps {
  onFileSelect?: (file: File) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function BurgerMenu(_props: BurgerMenuProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    theme, setTheme,
    windowSize, setWindowSize,
    mainWordFontSize, setMainWordFontSize,
    orientation, setOrientation,
    orpColored, setOrpColored,
    focalLine, setFocalLine,
    peripheralFade, setPeripheralFade,
    punctuationPause, setPunctuationPause,
    highlightColor, setHighlightColor,
    activeMode, selectPresetMode,
  } = useReaderContext();

  // New settings not yet in context — persisted to localStorage
  const [adaptiveOrp, setAdaptiveOrp] = useState(
    () => localStorage.getItem('fastread_adaptive_orp') !== 'false',
  );
  const [colorBlindMode, setColorBlindMode] = useState(
    () => localStorage.getItem('fastread_color_blind_mode') === 'deuteranopia',
  );
  const [fatigueReminder, setFatigueReminder] = useState(
    () => localStorage.getItem('fastread_fatigue_reminder') === 'true',
  );

  useEffect(() => { localStorage.setItem('fastread_adaptive_orp', String(adaptiveOrp)); }, [adaptiveOrp]);
  useEffect(() => {
    localStorage.setItem('fastread_color_blind_mode', colorBlindMode ? 'deuteranopia' : '');
  }, [colorBlindMode]);
  useEffect(() => { localStorage.setItem('fastread_fatigue_reminder', String(fatigueReminder)); }, [fatigueReminder]);

  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, closeMenu]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, closeMenu]);

  const handleModeSelect = (id: PresetModeId) => {
    selectPresetMode(id);
    closeMenu();
  };

  const orp_colors = ORP_COLORS[theme];
  const presetIds: PresetModeId[] = ['speed', 'focus', 'read'];

  return (
    <>
      <button className={styles.burgerBtn} onClick={openMenu} aria-label="Open menu" aria-expanded={open}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {open && (
        <div className={styles.overlay}>
          <div ref={panelRef} className={styles.drawer} role="dialog" aria-modal="true" aria-label="Settings">

            {/* ── Section 1: MODES ──────────────────────────────── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>⚡ MODES</div>
              <div className={styles.modeTabs}>
                {presetIds.map(id => {
                  const m = PRESET_MODES[id];
                  const isActive = activeMode === id;
                  return (
                    <button
                      key={id}
                      className={`${styles.modeTab} ${isActive ? styles.modeTabActive : ''}`}
                      onClick={() => handleModeSelect(id)}
                    >
                      <span className={styles.modeIcon}>{m.icon}</span>
                      <span className={styles.modeLabel}>{m.label}</span>
                    </button>
                  );
                })}
                <button className={`${styles.modeTab} ${activeMode === 'custom' ? styles.modeTabActive : ''}`}>
                  <span className={styles.modeIcon}>⚙️</span>
                  <span className={styles.modeLabel}>Custom</span>
                </button>
              </div>
              <p className={styles.modeDesc}>
                {activeMode !== 'custom' && activeMode in PRESET_MODES
                  ? PRESET_MODES[activeMode as PresetModeId].description
                  : 'Your current settings combination.'}
              </p>
            </div>

            <div className={styles.divider} />

            {/* ── Section 2: DISPLAY ─────────────────────────────── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>🎨 DISPLAY</div>

              {/* Theme */}
              <div className={styles.settingLabel}>Theme</div>
              <div className={styles.themeRow}>
                {(['midnight', 'warm', 'day'] as const).map(t => (
                  <button
                    key={t}
                    className={`${styles.themeBtn} ${theme === t ? styles.themeBtnActive : ''}`}
                    onClick={() => setTheme(t)}
                  >
                    <span
                      className={styles.themeSwatch}
                      style={{ background: THEME_SWATCHES[t] }}
                    />
                    <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                  </button>
                ))}
              </div>

              {/* Font size */}
              <div className={styles.settingLabel}>Font size</div>
              <div className={styles.fontSizeRow}>
                <span className={styles.fontSizeSmall}>A</span>
                <input
                  type="range"
                  min={60}
                  max={200}
                  step={5}
                  value={mainWordFontSize}
                  onChange={e => setMainWordFontSize(Number(e.target.value))}
                  className={styles.fontSlider}
                  aria-label="Font size"
                />
                <span className={styles.fontSizeLarge}>A</span>
              </div>

              {/* Words at once */}
              <div className={styles.settingLabel}>Words at once</div>
              <div className={styles.segControl}>
                {([1, 2, 3] as const).map(n => (
                  <button
                    key={n}
                    className={`${styles.segBtn} ${windowSize === n ? styles.segBtnActive : ''}`}
                    onClick={() => setWindowSize(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Horizontal layout toggle */}
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleName}>Horizontal layout</div>
                  <div className={styles.toggleDesc}>Left-to-right word display</div>
                </div>
                <input
                  type="checkbox"
                  className={styles.toggle}
                  checked={orientation === 'horizontal'}
                  onChange={e => setOrientation(e.target.checked ? 'horizontal' : 'vertical')}
                  aria-label="Horizontal layout"
                />
              </div>
            </div>

            <div className={styles.divider} />

            {/* ── Section 3: READING ────────────────────────────── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>👁 READING</div>

              {/* ORP color swatches */}
              <div className={styles.settingLabel}>Key letter color</div>
              <div className={styles.colorSwatches}>
                {orp_colors.map(opt => (
                  <button
                    key={opt.id}
                    className={`${styles.swatchBtn} ${highlightColor === opt.value ? styles.swatchBtnActive : ''}`}
                    onClick={() => setHighlightColor(opt.value)}
                    title={opt.reason}
                    aria-label={opt.label}
                  >
                    <span className={styles.swatch} style={{ background: opt.value }} />
                    <span className={styles.swatchLabel}>{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Reading toggles */}
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleName}>Highlight key letter</div>
                  <div className={styles.toggleDesc}>Color the ORP character</div>
                </div>
                <input type="checkbox" className={styles.toggle} checked={orpColored} onChange={e => setOrpColored(e.target.checked)} />
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleName}>Focal line</div>
                  <div className={styles.toggleDesc}>Show vertical tick marks</div>
                </div>
                <input type="checkbox" className={styles.toggle} checked={focalLine} onChange={e => setFocalLine(e.target.checked)} />
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleName}>Dim upcoming words</div>
                  <div className={styles.toggleDesc}>Fade context words</div>
                </div>
                <input type="checkbox" className={styles.toggle} checked={peripheralFade} onChange={e => setPeripheralFade(e.target.checked)} />
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleName}>Pause at punctuation</div>
                  <div className={styles.toggleDesc}>Brief delay at sentence ends</div>
                </div>
                <input type="checkbox" className={styles.toggle} checked={punctuationPause} onChange={e => setPunctuationPause(e.target.checked)} />
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleName}>Adaptive ORP</div>
                  <div className={styles.toggleDesc}>Stronger highlight above 350 WPM</div>
                </div>
                <input type="checkbox" className={styles.toggle} checked={adaptiveOrp} onChange={e => setAdaptiveOrp(e.target.checked)} />
              </div>
            </div>

            <div className={styles.divider} />

            {/* ── Section 4: ACCESSIBILITY ─────────────────────── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>♿ ACCESSIBILITY</div>

              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleName}>Color-blind ORP</div>
                  <div className={styles.toggleDesc}>Uses cyan — safe for all vision types</div>
                </div>
                <input type="checkbox" className={styles.toggle} checked={colorBlindMode} onChange={e => {
                  setColorBlindMode(e.target.checked);
                  if (e.target.checked) setHighlightColor('#5bc8dc');
                }} />
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleName}>Break reminder</div>
                  <div className={styles.toggleDesc}>Notify after 20 min of reading</div>
                </div>
                <input type="checkbox" className={styles.toggle} checked={fatigueReminder} onChange={e => setFatigueReminder(e.target.checked)} />
              </div>
            </div>

            <div className={styles.divider} />

            {/* ── Footer ────────────────────────────────────────── */}
            <div className={styles.footer}>
              <a className={styles.feedbackLink} href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer">
                💬 Send feedback
              </a>
              <span className={styles.version}>{APP_VERSION} · ReadSwift by TechScript</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
