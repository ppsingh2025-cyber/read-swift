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
 *   8  — Confirm and save
 */

import { useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import type { CustomMode, ModeSettings } from '../types/readingModes';
import styles from '../styles/SaveModeWizard.module.css';

interface SaveModeWizardProps {
  onClose: () => void;
  existingModes: CustomMode[];
}

type WizardSettings = {
  windowSize: 1 | 2 | 3;
  orpEnabled: boolean;
  orpColored: boolean;
  focalLine: boolean;
  peripheralFade: boolean;
  punctuationPause: boolean;
  longWordCompensation: boolean;
  chunkMode: 'fixed' | 'intelligent';
};

const TOTAL_STEPS = 10; // 0 (name) + 1 (window) + 2 (orp) + 3 (orp color) + 4 (focal) + 5 (fade) + 6 (punct) + 7 (long word) + 8 (chunk) + 9 (confirm)

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
    setSavedCustomModes,
    setActiveMode,
    setActiveCustomModeId,
    applyMode,
  } = useReaderContext();

  const [step, setStep] = useState(0);
  const [wizardName, setWizardName] = useState('');
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  // Pre-populate with current settings
  const [settings, setSettings] = useState<WizardSettings>(() => ({
    windowSize: ([1, 2, 3].includes(currentWindowSize)
      ? currentWindowSize
      : 1) as 1 | 2 | 3,
    orpEnabled: currentOrp,
    orpColored: currentOrpColored,
    focalLine: currentFocalLine,
    peripheralFade: currentPeripheralFade,
    punctuationPause: currentPuncPause,
    longWordCompensation: currentLongWord,
    chunkMode: currentChunkMode,
  }));

  const isSlotsFull = existingModes.length >= 3;

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
    };

    const newMode: CustomMode = {
      id: crypto.randomUUID(),
      name: wizardName.trim() || 'My Mode',
      settings: finalSettings,
      createdAt: new Date().toISOString(),
    };

    let nextModes: CustomMode[];
    if (replaceIndex !== null) {
      nextModes = [...existingModes];
      nextModes[replaceIndex] = newMode;
    } else {
      // Add newest first — keeps up to 2 oldest existing modes to maintain 3-slot limit
      nextModes = [newMode, ...existingModes.slice(0, 2)];
    }
    setSavedCustomModes(nextModes);
    setActiveMode('custom');
    setActiveCustomModeId(newMode.id);
    applyMode(finalSettings);
    onClose();
  };

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const stepLabel = `Step ${step + 1} of ${TOTAL_STEPS}`;

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
              <p className={styles.question}>How many words at once? (1–3)</p>
              <div className={styles.options}>
                {([1, 2, 3] as const).map((n) => (
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

          {/* ── Step 6: Punctuation pause ────────────────────── */}
          {step === 6 && (
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

          {/* ── Step 7: Long word compensation ──────────────── */}
          {step === 7 && (
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

          {/* ── Step 8: Chunk mode ───────────────────────────── */}
          {step === 8 && (
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

          {/* ── Step 9: Confirm ─────────────────────────────── */}
          {step === 9 && (
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
                  <li>Punctuation pause: {settings.punctuationPause ? 'On' : 'Off'}</li>
                  <li>Long-word delay: {settings.longWordCompensation ? 'On' : 'Off'}</li>
                  <li>Phrase grouping: {settings.chunkMode === 'intelligent' ? 'On' : 'Off'}</li>
                </ul>
              </div>

              {/* Replace slot selector (only when all 3 slots are full) */}
              {isSlotsFull && (
                <div className={styles.replaceBox}>
                  <p className={styles.replaceLabel}>All 3 slots are full. Choose one to replace:</p>
                  {existingModes.map((m, i) => (
                    <button
                      key={m.id}
                      className={`${styles.replaceBtn} ${replaceIndex === i ? styles.replaceBtnActive : ''}`}
                      onClick={() => setReplaceIndex(i)}
                      aria-pressed={replaceIndex === i}
                    >
                      Replace "{m.name}"
                    </button>
                  ))}
                </div>
              )}
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
              disabled={isSlotsFull && replaceIndex === null}
            >
              ✓ Save Mode
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
