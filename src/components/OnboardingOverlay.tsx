/**
 * OnboardingOverlay v3 — demo replicates real ReaderViewport visuals.
 * 250 WPM, ORP split, focal ticks, theme tokens throughout.
 *
 * Step flow (0-indexed):
 *   0 — Value prop
 *   1 — Live RSVP demo
 *   2 — How to succeed (tips)
 *   3 — Load anything
 *   4 — Quick setup (theme + mode picker)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../styles/OnboardingOverlay.module.css';
import type { Theme } from '../context/readerContextDef';
import type { PresetModeId } from '../types/readingModes';
import { useReaderContext } from '../context/useReaderContext';

const DEMO_WORDS = (
  'The human brain can process written words far faster than the eye can move across a page. ' +
  'Traditional reading forces your eyes to scan left to right, line by line, losing time ' +
  'at every saccade. Rapid Serial Visual Presentation eliminates that bottleneck entirely. ' +
  'Each word appears at a single fixed point on the screen. Your eyes stay completely still. ' +
  'Your brain receives each word directly, without the delay of physical eye movement. ' +
  'Consistent practice meaningfully increases reading speed by eliminating the overhead of ' +
  'eye movement. You are now reading at two hundred and fifty words per minute. ' +
  'Notice how effortless it feels.'
).split(/\s+/).filter(Boolean);

const DEMO_WPM = 250;
const DEMO_INTERVAL_MS = Math.round(60_000 / DEMO_WPM);

/**
 * Returns the Optimal Recognition Point (ORP) character index for a word.
 * ORP is the character position where the eye naturally fixates for fastest
 * word recognition. Formula: one position before each 5-character boundary.
 */
function calcOrpIndex(word: string): number {
  if (!word) return 0;
  return Math.max(0, Math.ceil(word.length / 5) - 1);
}

const MODES = [
  { id: 'speed' as PresetModeId, label: 'Sprint', emoji: '⚡', wpm: '400–500 WPM', desc: 'One word, no pauses. Pure velocity.',         setupDesc: 'Fast, no anchor',    accent: '#f59e0b' },
  { id: 'focus' as PresetModeId, label: 'Focus',  emoji: '🎯', wpm: '200–300 WPM', desc: 'ORP anchor + focal line. Precision reading.', setupDesc: 'ORP + focal line',   accent: 'var(--color-accent)', recommended: true },
  { id: 'read'  as PresetModeId, label: 'Flow',   emoji: '🌊', wpm: '150–200 WPM', desc: 'Up to 5 words with natural rhythm and context.',    setupDesc: '5 words, context',   accent: '#34d399' },
];

const DEFAULT_ONBOARDING_THEME: Theme = 'obsidian';
const DEFAULT_ONBOARDING_MODE: PresetModeId = 'focus';

interface OnboardingOverlayProps {
  onComplete: (prefs: { theme: Theme; modeId: PresetModeId }) => void;
  initialTheme?: Theme;
  initialModeId?: PresetModeId;
}

export default function OnboardingOverlay({ onComplete, initialTheme, initialModeId }: OnboardingOverlayProps) {
  const { setTheme, selectPresetMode } = useReaderContext();
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [demoIndex, setDemoIndex] = useState(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pickedTheme, setPickedTheme] = useState<Theme>(initialTheme ?? DEFAULT_ONBOARDING_THEME);
  const [pickedMode,  setPickedMode]  = useState<PresetModeId>(initialModeId ?? DEFAULT_ONBOARDING_MODE);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const clearDemo = useCallback(() => {
    if (intervalRef.current !== null) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const launchDemo = useCallback(() => {
    clearDemo();
    setDemoIndex(0);
    intervalRef.current = setInterval(() => {
      setDemoIndex(prev => {
        const next = prev + 1;
        if (next >= DEMO_WORDS.length) { clearInterval(intervalRef.current!); intervalRef.current = null; return prev; }
        return next;
      });
    }, DEMO_INTERVAL_MS);
  }, [clearDemo]);

  useEffect(() => () => clearDemo(), [clearDemo]);

  const advance = useCallback(() => {
    if (step < 4) {
      const next = step + 1;
      setStep(next);
      if (next === 1) launchDemo();
      else clearDemo();
    } else {
      onComplete({ theme: pickedTheme, modeId: pickedMode });
    }
  }, [step, onComplete, launchDemo, clearDemo, pickedTheme, pickedMode]);

  const goBack = useCallback(() => {
    if (step <= 0) return;
    const prev = step - 1;
    setStep(prev);
    if (prev === 1) launchDemo();    // arriving at demo step from either direction
    else clearDemo();                 // leaving demo step (step===1) or any other nav
  }, [step, launchDemo, clearDemo]);

  const skip = useCallback(
    () => onComplete({ theme: DEFAULT_ONBOARDING_THEME, modeId: DEFAULT_ONBOARDING_MODE }),
    [onComplete],
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Enter') advance(); if (e.key === 'Escape') skip(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [advance, skip]);

  const rawWord  = demoIndex >= 0 && demoIndex < DEMO_WORDS.length ? DEMO_WORDS[demoIndex] : '';
  const orpIdx   = calcOrpIndex(rawWord);
  const preORP   = rawWord.slice(0, orpIdx);
  const orpChar  = rawWord[orpIdx] ?? '';
  const postORP  = rawWord.slice(orpIdx + 1);
  const demoFinished = demoIndex === DEMO_WORDS.length - 1;

  return (
    <div className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`}
         role="dialog" aria-modal="true" aria-label="Welcome to PaceRead">
      <div className={styles.panel}>

        <div className={styles.dots} aria-label={`Step ${step + 1} of 5`}>
          {[0,1,2,3,4].map(i => (
            <span key={i} className={`${styles.dot} ${i === step ? styles.dotActive : ''}`} aria-hidden="true" />
          ))}
        </div>

        <div className={styles.stepContent} key={step}>

          {/* Step 0 — Value prop */}
          {step === 0 && (
            <div className={styles.step}>
              <div className={styles.heroIcon} aria-hidden="true">⚡</div>
              <h1 className={styles.heading}>Read 2× faster.<br />Same comprehension.</h1>
              <p className={styles.body}>
                PaceRead uses RSVP — Rapid Serial Visual Presentation — to eliminate
                the eye movement that slows every reader down.
              </p>
              <div className={styles.statRow}>
                <div className={styles.stat}>
                  <span className={styles.statNum}>250</span>
                  <span className={styles.statLabel}>avg WPM without training</span>
                </div>
                <span className={styles.statArrow} aria-hidden="true">→</span>
                <div className={styles.stat}>
                   <span className={styles.statNum} style={{ color: 'var(--color-accent)' }}>400+</span>
                  <span className={styles.statLabel}>WPM with regular practice</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 1 — Live demo */}
          {step === 1 && (
            <div className={styles.step}>
              <h1 className={styles.heading}>See it in action</h1>

              <div className={styles.demoViewport} aria-live="polite" aria-atomic="true">
                {demoIndex >= 0 && (
                  <>
                    <div className={styles.demoTickTop}    aria-hidden="true" />
                    <div className={styles.demoTickBottom} aria-hidden="true" />
                  </>
                )}
                {demoIndex === -1 ? (
                  <span className={styles.demoPlaceholder}>Get ready…</span>
                ) : (
                  <div className={styles.demoWordRow}>
                    <span className={styles.demoPreOrp}>{preORP}</span>
                    <span className={styles.demoOrpChar}>{orpChar}</span>
                    <span className={styles.demoPostOrp}>{postORP}</span>
                  </div>
                )}
              </div>

              <p className={styles.demoCaption}>
                {demoFinished
                  ? 'Your eyes stayed still the entire time. That is RSVP.'
                  : `${DEMO_WPM} WPM — words appear at a fixed point`}
              </p>
              <div className={styles.wpmChip} aria-hidden="true">
                <span className={styles.wpmDot} />{DEMO_WPM} WPM
              </div>
            </div>
          )}

          {/* Step 2 — How to succeed */}
          {step === 2 && (
            <div className={styles.step}>
              <h1 className={styles.heading}>Your first session</h1>
              <div className={styles.inputCards}>
                {[
                  { icon: '👁',  title: 'Lock your gaze',          desc: 'Keep your eyes completely still on the tick marks. Words come to you — do not chase them. This is the single habit that unlocks every speed gain.' },
                  { icon: '🐢', title: 'Start slow',               desc: 'Begin at 200–250 WPM. The goal of your first session is not speed — it is building stillness. Add 25 WPM only when a speed feels genuinely comfortable.' },
                  { icon: '📈', title: 'It clicks after 2–3 sessions', desc: 'RSVP feels unfamiliar at first, like a new physical skill. If the first session feels hard, that is expected and temporary — not a sign something is wrong.' },
                ].map(tip => (
                  <div key={tip.title} className={styles.inputCard}>
                    <span className={styles.inputCardIcon} aria-hidden="true">{tip.icon}</span>
                    <div>
                      <strong>{tip.title}</strong>
                      <span className={styles.inputFormats}>{tip.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Load content */}
          {step === 3 && (
            <div className={styles.step}>
              <h1 className={styles.heading}>Load anything</h1>
              <div className={styles.inputCards}>
                {[
                  { icon: '📂', title: 'Upload a file',  desc: 'PDF · EPUB · DOCX · TXT · MD · HTML · SRT' },
                  { icon: '📋', title: 'Paste text',     desc: 'Copy from anywhere — clipboard auto-detected' },
                  { icon: '🔗', title: 'Paste a URL',    desc: 'Fetches and extracts any web article' },
                ].map(card => (
                  <div key={card.title} className={styles.inputCard}>
                    <span className={styles.inputCardIcon} aria-hidden="true">{card.icon}</span>
                    <div>
                      <strong>{card.title}</strong>
                      <span className={styles.inputFormats}>{card.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className={styles.privacyNote}>🔒 All processing is local. No account needed.</p>
            </div>
          )}

          {/* Step 4 — Setup: theme + mode */}
          {step === 4 && (
            <div className={styles.step}>
              <h1 className={styles.heading}>Quick setup</h1>
              <p className={styles.body}>Pick a theme and reading mode. You can change both anytime.</p>

              {/* Theme picker */}
              <div className={styles.setupSection}>
                <p className={styles.setupLabel}>Theme</p>
                <div className={styles.themeRow}>
                  {([
                    { id: 'midnight',  label: 'Midnight',  bg: '#0f0f12', accent: '#5b8dee' },
                    { id: 'warm',      label: 'Warm',      bg: '#120f0a', accent: '#e8a830' },
                    { id: 'day',       label: 'Day',       bg: '#f5f0e8', accent: '#2a7a6e' },
                    { id: 'obsidian',  label: 'Obsidian',  bg: '#000000', accent: '#00d4ff' },
                  ] as const).map(t => (
                    <button
                      type="button"
                      key={t.id}
                      className={`${styles.themeBtn} ${pickedTheme === t.id ? styles.themeBtnActive : ''}`}
                      onClick={() => {
                        setPickedTheme(t.id);
                        setTheme(t.id);
                      }}
                      aria-pressed={pickedTheme === t.id}
                    >
                      <span
                        className={styles.themeSwatch}
                        style={{ background: t.bg, boxShadow: `inset 0 0 0 3px ${t.accent}` }}
                        aria-hidden="true"
                      />
                      <span className={styles.themeLabel}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode picker */}
              <div className={styles.setupSection}>
                <p className={styles.setupLabel}>Reading Mode</p>
                <div className={styles.modeRow}>
                  {MODES.map(m => (
                    <button
                      type="button"
                      key={m.id}
                      className={`${styles.modeBtn} ${pickedMode === m.id ? styles.modeBtnActive : ''}`}
                      onClick={() => {
                        setPickedMode(m.id);
                        selectPresetMode(m.id);
                      }}
                      aria-pressed={pickedMode === m.id}
                    >
                      <span className={styles.modeBtnEmoji} aria-hidden="true">{m.emoji}</span>
                      <span className={styles.modeBtnLabel}>{m.label}</span>
                      <span className={styles.modeBtnWpm} style={{ color: m.accent }}>{m.wpm}</span>
                      <span className={styles.modeBtnDesc}>{m.setupDesc}</span>
                      {m.recommended && <span className={styles.modeBtnBadge}>Recommended</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        <div className={styles.actions}>
          {step > 0 && (
            <button type="button" className={styles.btnBack} onClick={goBack}>← Back</button>
          )}
          {step === 1 && <button type="button" className={styles.btnSecondary} onClick={launchDemo}>Replay</button>}
          <button type="button" className={styles.btnPrimary} onClick={advance}>
            {step < 4 ? 'Next →' : 'Start Reading →'}
          </button>
          <button type="button" className={styles.btnSkip} onClick={skip}>Skip</button>
        </div>

      </div>
    </div>
  );
}
