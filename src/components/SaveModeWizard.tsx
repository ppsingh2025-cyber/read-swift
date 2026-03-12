/**
 * SaveModeWizard
 *
 * Step-by-step wizard for saving the current settings as a named custom mode.
 *
 * Steps (15 total, 0–14):
 *   0  — Name
 *   1  — Words at once (1–5)
 *   2  — Group into phrases           [skip if windowSize=1]
 *   3  — Speed (WPM)
 *   4  — Layout (horizontal/vertical)
 *   5  — Word size (main)
 *   6  — Side word size               [skip if windowSize=1]
 *   7  — Reading anchor (ORP)
 *   8  — Color anchor letter          [skip if !orpEnabled]
 *   9  — Focus guides
 *   10 — Dim side words               [skip if windowSize=1]
 *   11 — Dim level                    [skip if windowSize=1 OR !peripheralFade]
 *   12 — Pause at punctuation
 *   13 — Slow on long words
 *   14 — Confirm and save
 */

import { useState, useEffect, useCallback } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import type { CustomMode, ModeSettings } from '../types/readingModes';
import type { Orientation } from '../context/readerContextDef';
import styles from '../styles/SaveModeWizard.module.css';

interface SaveModeWizardProps {
  onClose: () => void;
  existingModes: CustomMode[];
}

type WizardSettings = {
  windowSize:           1 | 2 | 3 | 4 | 5;
  chunkMode:            'fixed' | 'intelligent';
  wpm:                  number;
  orientation:          Orientation;
  mainWordFontSize:     number;
  contextWordFontSize:  number;
  orpEnabled:           boolean;
  orpColored:           boolean;
  focalLine:            boolean;
  peripheralFade:       boolean;
  contextWordOpacity:   number;
  punctuationPause:     boolean;
  longWordCompensation: boolean;
};

const TOTAL_STEPS = 15; // 0–14
/** Wizard steps that present a Yes/No choice (for Y/N keyboard shortcut) */
const YES_NO_STEPS = [2, 7, 8, 9, 10, 12, 13];

const FONT_SIZE_LABELS: Record<number, string> = {
  70: 'Small', 85: 'Medium', 100: 'Normal', 120: 'Large', 150: 'X-Large', 180: 'Huge',
};

export default function SaveModeWizard({ onClose, existingModes }: SaveModeWizardProps) {
  const {
    windowSize:         currentWindowSize,
    orpEnabled:         currentOrp,
    orpColored:         currentOrpColored,
    focalLine:          currentFocalLine,
    peripheralFade:     currentPeripheralFade,
    punctuationPause:   currentPuncPause,
    longWordCompensation: currentLongWord,
    chunkMode:          currentChunkMode,
    wpm:                currentWpm,
    orientation:        currentOrientation,
    mainWordFontSize:   currentMainWordFontSize,
    contextWordFontSize: currentContextFontSize,
    contextWordOpacity: currentContextOpacity,
    setWpm,
    setOrientation,
    setMainWordFontSize,
    setSavedCustomModes,
    setActiveMode,
    setActiveCustomModeId,
    applyMode,
  } = useReaderContext();

  const [step, setStep] = useState(0);
  const [wizardName, setWizardName] = useState('');

  // Pre-populate with current settings
  const [settings, setSettings] = useState<WizardSettings>(() => ({
    windowSize: ([1, 2, 3, 4, 5].includes(currentWindowSize)
      ? currentWindowSize
      : 1) as 1 | 2 | 3 | 4 | 5,
    chunkMode:          currentChunkMode,
    wpm:                currentWpm,
    orientation:        currentOrientation,
    mainWordFontSize:   currentMainWordFontSize,
    contextWordFontSize: currentContextFontSize,
    orpEnabled:         currentOrp,
    orpColored:         currentOrpColored,
    focalLine:          currentFocalLine,
    peripheralFade:     currentPeripheralFade,
    contextWordOpacity: currentContextOpacity,
    punctuationPause:   currentPuncPause,
    longWordCompensation: currentLongWord,
  }));

  const handleSave = () => {
    const finalSettings: ModeSettings = {
      windowSize:           settings.windowSize,
      orpEnabled:           settings.orpEnabled,
      orpColored:           settings.orpColored,
      focalLine:            settings.focalLine,
      peripheralFade:       settings.peripheralFade,
      punctuationPause:     settings.punctuationPause,
      longWordCompensation: settings.longWordCompensation,
      chunkMode:            settings.chunkMode,
      contextWordFontSize:  settings.contextWordFontSize,
      contextWordOpacity:   settings.contextWordOpacity,
    };
    const newMode: CustomMode = {
      id: crypto.randomUUID(),
      name: wizardName.trim() || 'My Mode',
      settings: finalSettings,
      wpm: settings.wpm,
      createdAt: new Date().toISOString(),
    };
    setSavedCustomModes([newMode, ...existingModes]);
    setActiveMode('custom');
    setActiveCustomModeId(newMode.id);
    applyMode(finalSettings);
    if (newMode.wpm !== undefined) setWpm(newMode.wpm);
    // Apply global prefs (not stored in ModeSettings)
    setOrientation(settings.orientation);
    setMainWordFontSize(settings.mainWordFontSize);
    onClose();
  };

  const getSkippedSteps = useCallback((s: WizardSettings): Set<number> => {
    const skip = new Set<number>();
    if (s.windowSize === 1) { skip.add(2); skip.add(6); skip.add(10); skip.add(11); }
    if (!s.orpEnabled) skip.add(8);
    if (!s.peripheralFade) skip.add(11);
    return skip;
  }, []);

  const smartNext = useCallback(() => {
    const skipped = getSkippedSteps(settings);
    let n = step + 1;
    while (n < TOTAL_STEPS - 1 && skipped.has(n)) n++;
    setStep(Math.min(n, TOTAL_STEPS - 1));
  }, [step, settings, getSkippedSteps]);

  const smartBack = useCallback(() => {
    const skipped = getSkippedSteps(settings);
    let p = step - 1;
    while (p > 0 && skipped.has(p)) p--;
    setStep(Math.max(p, 0));
  }, [step, settings, getSkippedSteps]);

  // Progress label: based on visible steps only
  const skippedSteps  = getSkippedSteps(settings);
  const totalVisible  = TOTAL_STEPS - skippedSteps.size;
  const positionIndex = step - [...skippedSteps].filter(s => s < step).length;
  const stepLabel     = `Step ${positionIndex + 1} of ${totalVisible}`;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          if (step < TOTAL_STEPS - 1) {
            e.preventDefault();
            if (step === 0 && wizardName.trim().length === 0) return;
            smartNext();
          }
          break;
        case 'ArrowLeft':
          if (step > 0) { e.preventDefault(); smartBack(); }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case '1': case '2': case '3': case '4': case '5':
          if (step === 1) {
            e.preventDefault();
            setSettings(s => ({ ...s, windowSize: parseInt(e.key, 10) as 1|2|3|4|5 }));
          }
          break;
        case 'y': case 'Y':
          if (YES_NO_STEPS.includes(step)) {
            e.preventDefault();
            if (step === 2)  setSettings(s => ({ ...s, chunkMode: 'intelligent' }));
            if (step === 7)  setSettings(s => ({ ...s, orpEnabled: true }));
            if (step === 8)  setSettings(s => ({ ...s, orpColored: true }));
            if (step === 9)  setSettings(s => ({ ...s, focalLine: true }));
            if (step === 10) setSettings(s => ({ ...s, peripheralFade: true }));
            if (step === 12) setSettings(s => ({ ...s, punctuationPause: true }));
            if (step === 13) setSettings(s => ({ ...s, longWordCompensation: true }));
          }
          break;
        case 'n': case 'N':
          if (YES_NO_STEPS.includes(step)) {
            e.preventDefault();
            if (step === 2)  setSettings(s => ({ ...s, chunkMode: 'fixed' }));
            if (step === 7)  setSettings(s => ({ ...s, orpEnabled: false }));
            if (step === 8)  setSettings(s => ({ ...s, orpColored: false }));
            if (step === 9)  setSettings(s => ({ ...s, focalLine: false }));
            if (step === 10) setSettings(s => ({ ...s, peripheralFade: false }));
            if (step === 12) setSettings(s => ({ ...s, punctuationPause: false }));
            if (step === 13) setSettings(s => ({ ...s, longWordCompensation: false }));
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [step, wizardName, smartNext, smartBack, onClose]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Save custom mode">
      <div className={styles.sheet}>

        <div className={styles.header}>
          <span className={styles.title}>Save Custom Mode</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close wizard">✕</button>
        </div>

        <div className={styles.progress}>
          <div
            className={styles.progressFill}
            style={{ width: `${((positionIndex + 1) / totalVisible) * 100}%` }}
          />
        </div>
        <p className={styles.keyHint} aria-hidden="true">
          ← → to navigate · Y/N to choose · 1–5 for word count
        </p>

        <div className={styles.body}>
          <p className={styles.stepLabel}>{stepLabel}</p>

          {/* ── Step 0: Name ─────────────────────────────────── */}
          {step === 0 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>What would you like to call this mode?</p>
              <input
                className={styles.nameInput}
                type="text"
                maxLength={20}
                value={wizardName}
                onChange={(e) => setWizardName(e.target.value)}
                placeholder="e.g. Evening Reading"
                autoFocus
              />
              <p className={styles.hint}>{wizardName.length}/20 characters</p>
            </div>
          )}

          {/* ── Step 1: Words at once ────────────────────────── */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>How many words at once? (1–5)</p>
              <div className={styles.options}>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <button
                    key={n}
                    className={`${styles.optionBtn} ${settings.windowSize === n ? styles.optionBtnActive : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, windowSize: n }))}
                    aria-pressed={settings.windowSize === n}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Group into phrases (skipped if windowSize=1) ── */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Group words into natural phrases?</p>
              <div className={styles.options}>
                <button
                  className={`${styles.optionBtn} ${settings.chunkMode === 'intelligent' ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, chunkMode: 'intelligent' }))}
                  aria-pressed={settings.chunkMode === 'intelligent'}
                >Yes</button>
                <button
                  className={`${styles.optionBtn} ${settings.chunkMode === 'fixed' ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, chunkMode: 'fixed' }))}
                  aria-pressed={settings.chunkMode === 'fixed'}
                >No</button>
              </div>
            </div>
          )}

          {/* ── Step 3: Speed (WPM) ──────────────────────────── */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>What speed should this mode start at?</p>
              <div className={styles.wpmStepperWizard}>
                <button type="button" className={styles.wpmWizardBtn}
                        onClick={() => setSettings(s => ({ ...s, wpm: Math.max(60, s.wpm - 10) }))}
                        aria-label="Decrease WPM">−</button>
                <span className={styles.wpmWizardValue}>
                  {settings.wpm}<span className={styles.wpmWizardUnit}> WPM</span>
                </span>
                <button type="button" className={styles.wpmWizardBtn}
                        onClick={() => setSettings(s => ({ ...s, wpm: Math.min(1500, s.wpm + 10) }))}
                        aria-label="Increase WPM">+</button>
              </div>
              <p className={styles.hint}>You can change this anytime with the speed control.</p>
            </div>
          )}

          {/* ── Step 4: Layout ───────────────────────────────── */}
          {step === 4 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>How do you want words arranged?</p>
              <div className={styles.options}>
                <button
                  className={`${styles.optionBtn} ${settings.orientation === 'horizontal' ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, orientation: 'horizontal' }))}
                  aria-pressed={settings.orientation === 'horizontal'}
                >Horizontal</button>
                <button
                  className={`${styles.optionBtn} ${settings.orientation === 'vertical' ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, orientation: 'vertical' }))}
                  aria-pressed={settings.orientation === 'vertical'}
                >Vertical</button>
              </div>
            </div>
          )}

          {/* ── Step 5: Word size (main) ──────────────────────── */}
          {step === 5 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>How big should the word appear?</p>
              <div className={styles.options}>
                {([70, 85, 100, 120, 150, 180] as const).map((size) => (
                  <button
                    key={size}
                    className={`${styles.optionBtn} ${settings.mainWordFontSize === size ? styles.optionBtnActive : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, mainWordFontSize: size }))}
                    aria-pressed={settings.mainWordFontSize === size}
                  >
                    {FONT_SIZE_LABELS[size]}
                  </button>
                ))}
              </div>
              <p className={styles.hint}>You can always adjust this later.</p>
            </div>
          )}

          {/* ── Step 6: Side word size (skipped if windowSize=1) ── */}
          {step === 6 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>How big should side words appear?</p>
              <div className={styles.options}>
                {([0, 70, 85, 100, 120] as const).map((size) => (
                  <button
                    key={size}
                    className={`${styles.optionBtn} ${settings.contextWordFontSize === size ? styles.optionBtnActive : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, contextWordFontSize: size }))}
                    aria-pressed={settings.contextWordFontSize === size}
                  >
                    {size === 0 ? 'Same' : FONT_SIZE_LABELS[size]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 7: Reading anchor (ORP) ─────────────────── */}
          {step === 7 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Show a reading anchor point on each word?</p>
              <div className={styles.options}>
                <button
                  className={`${styles.optionBtn} ${settings.orpEnabled ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, orpEnabled: true }))}
                  aria-pressed={settings.orpEnabled}
                >Yes</button>
                <button
                  className={`${styles.optionBtn} ${!settings.orpEnabled ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, orpEnabled: false }))}
                  aria-pressed={!settings.orpEnabled}
                >No</button>
              </div>
            </div>
          )}

          {/* ── Step 8: Color anchor letter (skipped if !orpEnabled) ── */}
          {step === 8 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Color the anchor letter?</p>
              <div className={styles.options}>
                <button
                  className={`${styles.optionBtn} ${settings.orpColored ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, orpColored: true }))}
                  aria-pressed={settings.orpColored}
                >Yes</button>
                <button
                  className={`${styles.optionBtn} ${!settings.orpColored ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, orpColored: false }))}
                  aria-pressed={!settings.orpColored}
                >No</button>
              </div>
            </div>
          )}

          {/* ── Step 9: Focus guides ─────────────────────────── */}
          {step === 9 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Show focus guide tick marks?</p>
              <div className={styles.options}>
                <button
                  className={`${styles.optionBtn} ${settings.focalLine ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, focalLine: true }))}
                  aria-pressed={settings.focalLine}
                >Yes</button>
                <button
                  className={`${styles.optionBtn} ${!settings.focalLine ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, focalLine: false }))}
                  aria-pressed={!settings.focalLine}
                >No</button>
              </div>
            </div>
          )}

          {/* ── Step 10: Dim side words (skipped if windowSize=1) ── */}
          {step === 10 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Dim side words to focus on the main word?</p>
              <div className={styles.options}>
                <button
                  className={`${styles.optionBtn} ${settings.peripheralFade ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, peripheralFade: true }))}
                  aria-pressed={settings.peripheralFade}
                >Yes</button>
                <button
                  className={`${styles.optionBtn} ${!settings.peripheralFade ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, peripheralFade: false }))}
                  aria-pressed={!settings.peripheralFade}
                >No</button>
              </div>
            </div>
          )}

          {/* ── Step 11: Dim level (skipped if windowSize=1 OR !peripheralFade) ── */}
          {step === 11 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>How much should side words dim?</p>
              <p className={styles.hint}>100% = fully visible. Lower = more contrast with the main word.</p>
              <div className={styles.wpmStepperWizard}>
                <button type="button" className={styles.wpmWizardBtn}
                        onClick={() => setSettings(s => ({
                          ...s,
                          contextWordOpacity: Math.max(0.20, Math.round((s.contextWordOpacity - 0.05) * 20) / 20)
                        }))}
                        aria-label="Decrease opacity">−</button>
                <span className={styles.wpmWizardValue}>
                  {Math.round(settings.contextWordOpacity * 100)}
                  <span className={styles.wpmWizardUnit}>%</span>
                </span>
                <button type="button" className={styles.wpmWizardBtn}
                        onClick={() => setSettings(s => ({
                          ...s,
                          contextWordOpacity: Math.min(1.0, Math.round((s.contextWordOpacity + 0.05) * 20) / 20)
                        }))}
                        aria-label="Increase opacity">+</button>
              </div>
            </div>
          )}

          {/* ── Step 12: Pause at punctuation ────────────────── */}
          {step === 12 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Pause briefly at punctuation?</p>
              <div className={styles.options}>
                <button
                  className={`${styles.optionBtn} ${settings.punctuationPause ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, punctuationPause: true }))}
                  aria-pressed={settings.punctuationPause}
                >Yes</button>
                <button
                  className={`${styles.optionBtn} ${!settings.punctuationPause ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, punctuationPause: false }))}
                  aria-pressed={!settings.punctuationPause}
                >No</button>
              </div>
            </div>
          )}

          {/* ── Step 13: Slow on long words ───────────────────── */}
          {step === 13 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Slow down for long words?</p>
              <div className={styles.options}>
                <button
                  className={`${styles.optionBtn} ${settings.longWordCompensation ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, longWordCompensation: true }))}
                  aria-pressed={settings.longWordCompensation}
                >Yes</button>
                <button
                  className={`${styles.optionBtn} ${!settings.longWordCompensation ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, longWordCompensation: false }))}
                  aria-pressed={!settings.longWordCompensation}
                >No</button>
              </div>
            </div>
          )}

          {/* ── Step 14: Confirm ──────────────────────────────── */}
          {step === 14 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Ready to save?</p>
              <div className={styles.summary}>
                <p className={styles.summaryName}>"{wizardName.trim() || 'My Mode'}"</p>
                <ul className={styles.summaryList}>
                  <li>{settings.windowSize} word{settings.windowSize !== 1 ? 's' : ''} at a time</li>
                  {settings.windowSize > 1 && (
                    <li>Phrase grouping: {settings.chunkMode === 'intelligent' ? 'On' : 'Off'}</li>
                  )}
                  <li>Speed: {settings.wpm} WPM</li>
                  <li>Layout: {settings.orientation}</li>
                  <li>Word size: {FONT_SIZE_LABELS[settings.mainWordFontSize] ?? `${settings.mainWordFontSize}%`}</li>
                  {settings.windowSize > 1 && (
                    <li>Side word size: {settings.contextWordFontSize === 0
                      ? 'Same as main'
                      : (FONT_SIZE_LABELS[settings.contextWordFontSize] ?? `${settings.contextWordFontSize}%`)}</li>
                  )}
                  <li>Reading anchor: {settings.orpEnabled ? 'On' : 'Off'}</li>
                  {settings.orpEnabled && (
                    <li>Color anchor letter: {settings.orpColored ? 'On' : 'Off'}</li>
                  )}
                  <li>Focus guides: {settings.focalLine ? 'On' : 'Off'}</li>
                  {settings.windowSize > 1 && (
                    <li>Dim side words: {settings.peripheralFade ? 'On' : 'Off'}</li>
                  )}
                  {settings.windowSize > 1 && settings.peripheralFade && (
                    <li>Dim level: {Math.round(settings.contextWordOpacity * 100)}%</li>
                  )}
                  <li>Pause at punctuation: {settings.punctuationPause ? 'On' : 'Off'}</li>
                  <li>Slow on long words: {settings.longWordCompensation ? 'On' : 'Off'}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 0 && (
            <button className={styles.backBtn} onClick={smartBack}>← Back</button>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <button
              className={styles.nextBtn}
              onClick={smartNext}
              disabled={step === 0 && wizardName.trim().length === 0}
            >
              Next →
            </button>
          ) : (
            <button
              className={styles.saveBtn}
              onClick={handleSave}
            >
              ✓ Save mode
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
