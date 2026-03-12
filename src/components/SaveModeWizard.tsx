/**
 * SaveModeWizard
 *
 * Step-by-step wizard for saving the current settings as a named custom mode.
 *
 * Steps:
 *   0  — Name (text input, max 20 chars)
 *   1  — How many words at once? (1–3)
 *   2  — Highlight the key letter in each word?
 *   3  — Show focal guide tick marks?
 *   4  — Dim upcoming words?
 *   5  — Pause briefly at punctuation?
 *   6  — Slow down for long words?
 *   7  — Group words into natural phrases?
 *   8  — Chunk mode
 *   9  — What speed? (WPM stepper)
 *   10 — Confirm and save
 */

import { useState, useEffect, useCallback } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import type { CustomMode, ModeSettings } from '../types/readingModes';
import styles from '../styles/SaveModeWizard.module.css';

interface SaveModeWizardProps {
  onClose: () => void;
  existingModes: CustomMode[];
}

type WizardSettings = {
  windowSize: 1 | 2 | 3 | 4 | 5;
  orpEnabled: boolean;
  orpColored: boolean;
  focalLine: boolean;
  peripheralFade: boolean;
  contextWordFontSize: number;
  contextWordOpacity: number;
  punctuationPause: boolean;
  longWordCompensation: boolean;
  chunkMode: 'fixed' | 'intelligent';
  wpm: number;
};

const TOTAL_STEPS = 13; // 0–12
/** Wizard steps that present a Yes/No choice (for Y/N keyboard shortcut) */
const YES_NO_STEPS = [2, 3, 4, 5, 6, 8, 9, 12];

export default function SaveModeWizard({ onClose, existingModes }: SaveModeWizardProps) {
  const {
    windowSize: currentWindowSize,
    orpEnabled: currentOrp,
    orpColored: currentOrpColored,
    focalLine: currentFocalLine,
    peripheralFade: currentPeripheralFade,
    punctuationPause: currentPuncPause,
    longWordCompensation: currentLongWord,
    chunkMode: currentChunkMode,
    wpm: currentWpm,
    contextWordFontSize: currentContextFontSize,
    contextWordOpacity: currentContextOpacity,
    setWpm,
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
    orpEnabled: currentOrp,
    orpColored: currentOrpColored,
    focalLine: currentFocalLine,
    peripheralFade: currentPeripheralFade,
    contextWordFontSize: currentContextFontSize,
    contextWordOpacity: currentContextOpacity,
    punctuationPause: currentPuncPause,
    longWordCompensation: currentLongWord,
    chunkMode: currentChunkMode,
    wpm: currentWpm,
  }));

  const handleSave = () => {
    const finalSettings: ModeSettings = {
      windowSize: settings.windowSize,
      orpEnabled: settings.orpEnabled,
      orpColored: settings.orpColored,
      focalLine: settings.focalLine,
      peripheralFade: settings.peripheralFade,
      punctuationPause: settings.punctuationPause,
      longWordCompensation: settings.longWordCompensation,
      chunkMode: settings.chunkMode,
      contextWordFontSize: settings.contextWordFontSize,
      contextWordOpacity: settings.contextWordOpacity,
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
    onClose();
  };

  const next = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)), []);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const stepLabel = `Step ${step + 1} of ${TOTAL_STEPS}`;

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
            next();
          }
          break;
        case 'ArrowLeft':
          if (step > 0) { e.preventDefault(); back(); }
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
            if (step === 2)  setSettings(s => ({ ...s, orpEnabled: true }));
            if (step === 3)  setSettings(s => ({ ...s, orpColored: true }));
            if (step === 4)  setSettings(s => ({ ...s, focalLine: true }));
            if (step === 5)  setSettings(s => ({ ...s, peripheralFade: true }));
            if (step === 6)  setSettings(s => ({ ...s, contextWordFontSize: 0 }));
            if (step === 8)  setSettings(s => ({ ...s, punctuationPause: true }));
            if (step === 9)  setSettings(s => ({ ...s, longWordCompensation: true }));
            if (step === 12) setSettings(s => ({ ...s, chunkMode: 'intelligent' }));
          }
          break;
        case 'n': case 'N':
          if (YES_NO_STEPS.includes(step)) {
            e.preventDefault();
            if (step === 2)  setSettings(s => ({ ...s, orpEnabled: false }));
            if (step === 3)  setSettings(s => ({ ...s, orpColored: false }));
            if (step === 4)  setSettings(s => ({ ...s, focalLine: false }));
            if (step === 5)  setSettings(s => ({ ...s, peripheralFade: false }));
            if (step === 6)  setSettings(s => ({ ...s, contextWordFontSize: 85 }));
            if (step === 8)  setSettings(s => ({ ...s, punctuationPause: false }));
            if (step === 9)  setSettings(s => ({ ...s, longWordCompensation: false }));
            if (step === 12) setSettings(s => ({ ...s, chunkMode: 'fixed' }));
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [step, wizardName, next, back, onClose]);

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
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
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

          {/* ── Step 1: Window size ──────────────────────────── */}
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

          {/* ── Step 2: ORP highlight ────────────────────────── */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Highlight the key letter in each word?</p>
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

          {/* ── Step 3: ORP coloring ────────────────────────── */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Color the key letter?</p>
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

          {/* ── Step 4: Focal line ───────────────────────────── */}
          {step === 4 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Show focal guide tick marks?</p>
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

          {/* ── Step 5: Peripheral fade ──────────────────────── */}
          {step === 5 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Dim upcoming words?</p>
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

          {/* ── Step 6: Context word size ────────────────────── */}
          {step === 6 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Should context words be the same size as the main word?</p>
              <p className={styles.hint}>Off = context words appear smaller, creating visual hierarchy.</p>
              <div className={styles.options}>
                <button
                  className={`${styles.optionBtn} ${settings.contextWordFontSize === 0 ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings(s => ({ ...s, contextWordFontSize: 0 }))}
                  aria-pressed={settings.contextWordFontSize === 0}
                >Same size</button>
                <button
                  className={`${styles.optionBtn} ${settings.contextWordFontSize !== 0 ? styles.optionBtnActive : ''}`}
                  onClick={() => setSettings(s => ({ ...s, contextWordFontSize: 85 }))}
                  aria-pressed={settings.contextWordFontSize !== 0}
                >Smaller</button>
              </div>
            </div>
          )}

          {/* ── Step 7: Dim amount ───────────────────────────── */}
          {step === 7 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>How much should context words dim?</p>
              <p className={styles.hint}>100% = fully visible. 20% = very faint. Applied when dimming is on.</p>
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

          {/* ── Step 8: Punctuation pause ────────────────────── */}
          {step === 8 && (
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

          {/* ── Step 9: Long word compensation ──────────────── */}
          {step === 9 && (
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

          {/* ── Step 10: Chunk mode ───────────────────────────── */}
          {step === 10 && (
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

          {/* ── Step 11: WPM ─────────────────────────────────── */}
          {step === 11 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>What speed should this mode use?</p>
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
              <p className={styles.hint}>Range: 60–1500 WPM. Applied when you activate this mode.</p>
            </div>
          )}

          {/* ── Step 12: Confirm ────────────────────────────── */}
          {step === 12 && (
            <div className={styles.stepContent}>
              <p className={styles.question}>Ready to save?</p>
              <div className={styles.summary}>
                <p className={styles.summaryName}>"{wizardName.trim() || 'My Mode'}"</p>
                <ul className={styles.summaryList}>
                  <li>{settings.windowSize} word{settings.windowSize !== 1 ? 's' : ''} at a time</li>
                  <li>Key letter highlight: {settings.orpEnabled ? 'On' : 'Off'}</li>
                  <li>Color key letter: {settings.orpColored ? 'On' : 'Off'}</li>
                  <li>Focal ticks: {settings.focalLine ? 'On' : 'Off'}</li>
                  <li>Peripheral fade: {settings.peripheralFade ? 'On' : 'Off'}</li>
                  <li>Context word size: {settings.contextWordFontSize === 0 ? 'Same as main' : 'Smaller'}</li>
                  <li>Context word opacity: {Math.round(settings.contextWordOpacity * 100)}%</li>
                  <li>Punctuation pause: {settings.punctuationPause ? 'On' : 'Off'}</li>
                  <li>Long-word delay: {settings.longWordCompensation ? 'On' : 'Off'}</li>
                  <li>Phrase grouping: {settings.chunkMode === 'intelligent' ? 'On' : 'Off'}</li>
                  <li>Speed: {settings.wpm} WPM</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 0 && (
            <button className={styles.backBtn} onClick={back}>← Back</button>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <button
              className={styles.nextBtn}
              onClick={next}
              disabled={step === 0 && wizardName.trim().length === 0}
            >
              Next →
            </button>
          ) : (
            <button
              className={styles.saveBtn}
              onClick={handleSave}
            >
              ✓ Save Mode
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
