import { useCallback, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import { PRESET_MODES } from '../config/readingModePresets';
import type { PresetModeId, CustomMode, ModeSettings } from '../types/readingModes';
import type { WindowSize, Orientation } from '../context/readerContextDef';
import { ORP_COLORS } from '../config/orpColors';
import SaveModeWizard from './SaveModeWizard';
import styles from '../styles/ReadingModes.module.css';

const LS_FINETUNE = 'fastread_finetune_open';

function specLine(s: ModeSettings, wpm?: number): string {
  const parts: string[] = [];
  parts.push(s.windowSize === 1 ? '1 word' : `${s.windowSize} words`);
  if (s.orpEnabled)              parts.push('ORP');
  if (s.focalLine)               parts.push('focal');
  if (s.peripheralFade)          parts.push('fade');
  if (s.punctuationPause)        parts.push('pauses');
  if (s.longWordCompensation)    parts.push('long-word');
  if (s.chunkMode === 'intelligent') parts.push('phrases');
  if (wpm !== undefined)         parts.push(`${wpm} WPM`);
  return parts.join(' · ');
}

export default function ReadingModes() {
  const {
    activeMode, setActiveMode,
    activeCustomModeId, setActiveCustomModeId,
    savedCustomModes, setSavedCustomModes,
    selectPresetMode, selectCustomMode,
    windowSize, setWindowSize,
    orpEnabled, setOrpEnabled,
    orpColored, setOrpColored,
    focalLine, setFocalLine,
    peripheralFade, setPeripheralFade,
    punctuationPause, setPunctuationPause,
    longWordCompensation, setLongWordCompensation,
    chunkMode, setChunkMode,
    wpm, setWpm,
    orientation, setOrientation,
    highlightColor, setHighlightColor,
    mainWordFontSize, setMainWordFontSize,
    theme,
    contextWordFontSize, setContextWordFontSize,
    contextWordOpacity, setContextWordOpacity,
  } = useReaderContext();

  const [wizardOpen, setWizardOpen]     = useState(false);
  const [finetuneOpen, setFinetuneOpen] = useState<boolean>(
    () => localStorage.getItem(LS_FINETUNE) !== 'false'
  );
  const [saveName, setSaveName]         = useState('');
  const [saveError, setSaveError]       = useState('');
  const [isDirty, setIsDirty]           = useState(false);

  const toggleFinetune = useCallback(() => {
    setFinetuneOpen(prev => {
      const next = !prev;
      localStorage.setItem(LS_FINETUNE, String(next));
      return next;
    });
  }, []);

  const deleteCustomMode = useCallback((mode: CustomMode) => {
    setSavedCustomModes(savedCustomModes.filter(m => m.id !== mode.id));
    if (activeCustomModeId === mode.id) setActiveCustomModeId(null);
  }, [savedCustomModes, setSavedCustomModes, activeCustomModeId, setActiveCustomModeId]);

  const handleFinetuneChange = useCallback((apply: () => void) => {
    apply();
    if (activeMode === 'custom' && activeCustomModeId) {
      setIsDirty(true);
    } else {
      setActiveMode('custom');
      setActiveCustomModeId(null);
    }
  }, [setActiveMode, setActiveCustomModeId, activeMode, activeCustomModeId]);

  const updateActiveCustomMode = useCallback(() => {
    if (!activeCustomModeId) return;
    const updated = savedCustomModes.map((m: CustomMode) =>
      m.id === activeCustomModeId
        ? { ...m, wpm, settings: { windowSize, orpEnabled, orpColored, focalLine,
            peripheralFade, punctuationPause, longWordCompensation, chunkMode,
            contextWordFontSize, contextWordOpacity } }
        : m
    );
    setSavedCustomModes(updated);
    setIsDirty(false);
  }, [activeCustomModeId, wpm, windowSize, orpEnabled, orpColored, focalLine,
      peripheralFade, punctuationPause, longWordCompensation, chunkMode,
      contextWordFontSize, contextWordOpacity,
      savedCustomModes, setSavedCustomModes]);

  const handleInlineSave = useCallback(() => {
    const trimmed = saveName.trim();
    if (!trimmed) { setSaveError('Enter a name'); return; }
    if (trimmed.length > 24) { setSaveError('Max 24 characters'); return; }
    setSaveError('');
    const newMode: CustomMode = {
      id: typeof crypto?.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      name: trimmed,
      wpm,
      settings: { windowSize, orpEnabled, orpColored, focalLine,
                  peripheralFade, punctuationPause, longWordCompensation, chunkMode,
                  contextWordFontSize, contextWordOpacity },
      createdAt: new Date().toISOString(),
    };
    setSavedCustomModes([newMode, ...savedCustomModes]);
    setActiveMode('custom');
    setActiveCustomModeId(newMode.id);
    setSaveName('');
    setIsDirty(false);
  }, [saveName, wpm, windowSize, orpEnabled, orpColored, focalLine,
      peripheralFade, punctuationPause, longWordCompensation, chunkMode,
      contextWordFontSize, contextWordOpacity,
      savedCustomModes, setSavedCustomModes, setActiveMode, setActiveCustomModeId]);

  const activePreset = (['speed', 'focus', 'read'] as PresetModeId[]).includes(
    activeMode as PresetModeId
  ) ? (activeMode as PresetModeId) : null;

  // toggleRows kept as a reference for updateActiveCustomMode / handleInlineSave field
  // enumeration; individual rows rendered explicitly below for conditional control
  const toggleRows: Array<{ key: string; label: string; value: boolean; set: (v: boolean) => void }> = [
    { key: 'orpEnabled',           label: 'Reading anchor',         value: orpEnabled,           set: setOrpEnabled },
    { key: 'orpColored',           label: 'Highlight anchor letter', value: orpColored,           set: setOrpColored },
    { key: 'focalLine',            label: 'Focus guides',           value: focalLine,            set: setFocalLine },
    { key: 'peripheralFade',       label: 'Dim side words',         value: peripheralFade,       set: setPeripheralFade },
    { key: 'punctuationPause',     label: 'Pause at punctuation',   value: punctuationPause,     set: setPunctuationPause },
    { key: 'longWordCompensation', label: 'Slow on long words',     value: longWordCompensation, set: setLongWordCompensation },
  ];
  void toggleRows; // kept for reference, rendered individually

  return (
    <div className={styles.root}>

      {/* 1 — Preset tiles */}
      <div className={styles.presetRow} role="group" aria-label="Reading presets">
        {(['speed', 'focus', 'read'] as PresetModeId[]).map(id => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={activeMode === id}
            className={`${styles.presetTile} ${activeMode === id ? styles.presetTileActive : ''}`}
            onClick={() => { selectPresetMode(id); setIsDirty(false); }}
          >
            <span className={styles.tileIcon} aria-hidden="true">{PRESET_MODES[id].icon}</span>
            <span className={styles.tileLabel}>{PRESET_MODES[id].label}</span>
          </button>
        ))}
      </div>

      {activePreset && (
        <p className={styles.specStrip}>{specLine(PRESET_MODES[activePreset].settings)}</p>
      )}

      {/* 2 — Custom modes grid */}
      <div className={styles.customGrid} role="group" aria-label="Custom modes">
        {savedCustomModes.map(mode => {
          const isActive = activeCustomModeId === mode.id && activeMode === 'custom';
          return (
            <div key={mode.id} className={styles.customTileWrapper}>
              <button
                type="button"
                className={`${styles.customTile} ${isActive ? styles.customTileActive : ''}`}
                onClick={() => { selectCustomMode(mode); setIsDirty(false); }}
                aria-pressed={isActive}
                title={specLine(mode.settings, mode.wpm)}
              >
                <span className={styles.tileIcon} aria-hidden="true">⚡</span>
                <span className={styles.tileLabel}>{mode.name}</span>
                {mode.wpm && <span className={styles.tileWpm}>{mode.wpm}</span>}
              </button>
              <button
                type="button"
                className={styles.deleteTileBtn}
                onClick={e => { e.stopPropagation(); deleteCustomMode(mode); }}
                aria-label={`Delete "${mode.name}"`}
              >×</button>
            </div>
          );
        })}
        <button
          type="button"
          className={styles.wizardTile}
          onClick={() => setWizardOpen(true)}
          aria-label="Open guided mode builder"
        >
          <span className={styles.tileIcon} aria-hidden="true">✦</span>
          <span className={styles.tileLabel}>New Mode</span>
        </button>
      </div>

      {/* Active custom mode spec strip */}
      {activeMode === 'custom' && activeCustomModeId && (() => {
        const m = savedCustomModes.find(x => x.id === activeCustomModeId);
        return m ? <p className={styles.specStrip}>{specLine(m.settings, m.wpm)}</p> : null;
      })()}

      {/* 3 — Fine-tune accordion */}
      <div className={styles.accordion}>
        <button
          type="button"
          className={styles.accordionToggle}
          onClick={toggleFinetune}
          aria-expanded={finetuneOpen}
        >
          <span className={styles.accordionLabel}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                 strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
            Fine-tune Reading Mode
          </span>
          <span className={styles.accordionChevron}
                style={{ transform: finetuneOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                aria-hidden="true">▼</span>
        </button>

        {finetuneOpen && (
          <div className={styles.accordionBody}>

            {/* Name & save at the very top */}
            <div className={styles.inlineSave}>
              <input type="text" className={styles.saveNameInput}
                     placeholder="Name this setup…" maxLength={24} value={saveName}
                     onChange={e => { setSaveName(e.target.value); setSaveError(''); }}
                     onKeyDown={e => { if (e.key === 'Enter') handleInlineSave(); }}
                     aria-label="Custom mode name" />
              <button type="button" className={styles.saveBtn}
                      onClick={handleInlineSave} disabled={!saveName.trim()}
                      aria-label="Save current settings as custom mode">Save</button>
            </div>
            {saveError && <p className={styles.saveError}>{saveError}</p>}

            {/* Update button when editing a saved custom mode */}
            {isDirty && activeMode === 'custom' && activeCustomModeId && (() => {
              const activeName = savedCustomModes.find(m => m.id === activeCustomModeId)?.name;
              return activeName ? (
                <button type="button" className={styles.updateModeBtn}
                        onClick={updateActiveCustomMode}>
                  ✓ Update "{activeName}"
                </button>
              ) : null;
            })()}

            {/* ── GROUP 1: PACING ─────────────────────────────── */}

            {/* Speed */}
            <div className={styles.fineRow}>
              <span className={styles.fineName}>Speed</span>
              <div className={styles.wpmStepper}>
                <button type="button" className={styles.wpmStepBtn}
                        onClick={() => handleFinetuneChange(() => setWpm(Math.max(60, wpm - 10)))}
                        aria-label="Decrease WPM">−</button>
                <span className={styles.wpmValue}>{wpm} WPM</span>
                <button type="button" className={styles.wpmStepBtn}
                        onClick={() => handleFinetuneChange(() => setWpm(Math.min(1500, wpm + 10)))}
                        aria-label="Increase WPM">+</button>
              </div>
            </div>

            {/* Words shown */}
            <div className={styles.fineRow}>
              <span className={styles.fineName}>Words shown</span>
              <div className={styles.segmented}>
                {([1, 2, 3, 4, 5] as WindowSize[]).map(n => (
                  <button key={n} type="button"
                          className={`${styles.segBtn} ${windowSize === n ? styles.segBtnActive : ''}`}
                          onClick={() => handleFinetuneChange(() => setWindowSize(n))}
                          aria-pressed={windowSize === n}>{n}</button>
                ))}
              </div>
            </div>

            {/* Group into phrases — hidden when windowSize === 1 */}
            {windowSize > 1 && (
              <label className={`${styles.fineRow} ${styles.fineGroupDivider}`} style={{ cursor: 'pointer' }}>
                <span className={styles.fineName}>Group into phrases</span>
                <input type="checkbox" className={styles.toggle}
                       checked={chunkMode === 'intelligent'}
                       onChange={e => handleFinetuneChange(() =>
                         setChunkMode(e.target.checked ? 'intelligent' : 'fixed'))} />
              </label>
            )}

            {/* ── GROUP 2: DISPLAY ────────────────────────────── */}

            {/* Layout — divider when windowSize=1 (Group into phrases hidden) */}
            <div className={`${styles.fineRow} ${windowSize === 1 ? styles.fineGroupDivider : ''}`}>
              <span className={styles.fineName}>Layout</span>
              <select className={styles.fineSelect}
                      value={orientation}
                      onChange={e => handleFinetuneChange(() => setOrientation(e.target.value as Orientation))}
                      aria-label="Word window orientation">
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>

            {/* Word size */}
            <div className={styles.fineRow}>
              <span className={styles.fineName}>Word size</span>
              <select className={styles.fineSelect}
                      value={mainWordFontSize}
                      onChange={e => handleFinetuneChange(() => setMainWordFontSize(parseInt(e.target.value, 10)))}
                      aria-label="Main word font size">
                <option value={70}>Small</option>
                <option value={85}>Medium</option>
                <option value={100}>Normal</option>
                <option value={120}>Large</option>
                <option value={150}>X-Large</option>
                <option value={180}>Huge</option>
              </select>
            </div>

            {/* Side word size — hidden when windowSize === 1 */}
            {windowSize > 1 && (
              <div className={styles.fineRow}>
                <span className={styles.fineName}>Side word size</span>
                <select className={styles.fineSelect}
                        value={contextWordFontSize}
                        onChange={e => handleFinetuneChange(() => setContextWordFontSize(parseInt(e.target.value, 10)))}
                        aria-label="Side word font size">
                  <option value={0}>Same as main</option>
                  <option value={70}>Small</option>
                  <option value={85}>Medium</option>
                  <option value={100}>Normal</option>
                  <option value={120}>Large</option>
                  <option value={150}>X-Large</option>
                  <option value={180}>Huge</option>
                </select>
              </div>
            )}

            {/* ── GROUP 3: FOCUS AIDS ─────────────────────────── */}

            {/* Reading anchor */}
            <label className={`${styles.fineRow} ${styles.fineGroupDivider}`} style={{ cursor: 'pointer' }}>
              <span className={styles.fineName}>Reading anchor</span>
              <input type="checkbox" className={styles.toggle} checked={orpEnabled}
                     onChange={e => handleFinetuneChange(() => setOrpEnabled(e.target.checked))} />
            </label>

            {/* Highlight anchor letter */}
            <label className={styles.fineRow} style={{ cursor: 'pointer' }}>
              <span className={styles.fineName}>Highlight anchor letter</span>
              <input type="checkbox" className={styles.toggle} checked={orpColored}
                     onChange={e => handleFinetuneChange(() => setOrpColored(e.target.checked))} />
            </label>

            {/* Anchor letter color */}
            <div className={styles.fineRow}>
              <span className={styles.fineName}>Anchor letter color</span>
              <div className={styles.colorSwatches}>
                {ORP_COLORS[theme].map(option => (
                  <button
                    type="button"
                    key={option.id}
                    className={`${styles.swatchBtn} ${highlightColor === option.value ? styles.swatchBtnActive : ''}`}
                    onClick={() => handleFinetuneChange(() => setHighlightColor(option.value))}
                    aria-label={option.label}
                    title={option.reason}
                  >
                    <span className={styles.swatchDot} style={{ background: option.value }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Focus guides */}
            <label className={styles.fineRow} style={{ cursor: 'pointer' }}>
              <span className={styles.fineName}>Focus guides</span>
              <input type="checkbox" className={styles.toggle} checked={focalLine}
                     onChange={e => handleFinetuneChange(() => setFocalLine(e.target.checked))} />
            </label>

            {/* ── GROUP 4: SIDE WORDS — entire group hidden when windowSize === 1 */}
            {windowSize > 1 && <>
              {/* Dim side words */}
              <label className={`${styles.fineRow} ${styles.fineGroupDivider}`} style={{ cursor: 'pointer' }}>
                <span className={styles.fineName}>Dim side words</span>
                <input type="checkbox" className={styles.toggle} checked={peripheralFade}
                       onChange={e => handleFinetuneChange(() => setPeripheralFade(e.target.checked))} />
              </label>

              {/* Dim level — only when Dim side words is ON */}
              {peripheralFade && (
                <div className={styles.fineRow}>
                  <span className={styles.fineName}>Dim level</span>
                  <div className={styles.wpmStepper}>
                    <button type="button" className={styles.wpmStepBtn}
                            onClick={() => handleFinetuneChange(() =>
                              setContextWordOpacity(Math.max(0.20, contextWordOpacity - 0.05)))}
                            aria-label="Less dim">−</button>
                    <span className={styles.wpmValue}>{Math.round(contextWordOpacity * 100)}%</span>
                    <button type="button" className={styles.wpmStepBtn}
                            onClick={() => handleFinetuneChange(() =>
                              setContextWordOpacity(Math.min(1.0, contextWordOpacity + 0.05)))}
                            aria-label="More dim">+</button>
                  </div>
                </div>
              )}
            </>}

            {/* ── GROUP 5: READING ENGINE ─────────────────────── */}

            {/* Pause at punctuation */}
            <label className={`${styles.fineRow} ${styles.fineGroupDivider}`} style={{ cursor: 'pointer' }}>
              <span className={styles.fineName}>Pause at punctuation</span>
              <input type="checkbox" className={styles.toggle} checked={punctuationPause}
                     onChange={e => handleFinetuneChange(() => setPunctuationPause(e.target.checked))} />
            </label>

            {/* Slow on long words */}
            <label className={styles.fineRow} style={{ cursor: 'pointer' }}>
              <span className={styles.fineName}>Slow on long words</span>
              <input type="checkbox" className={styles.toggle} checked={longWordCompensation}
                     onChange={e => handleFinetuneChange(() => setLongWordCompensation(e.target.checked))} />
            </label>

          </div>
        )}
      </div>

      {wizardOpen && (
        <SaveModeWizard onClose={() => setWizardOpen(false)} existingModes={savedCustomModes} />
      )}
    </div>
  );
}
