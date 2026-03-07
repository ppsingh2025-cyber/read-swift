/**
 * OnboardingOverlay
 *
 * Full-screen first-launch overlay introducing new users to ReadSwift.
 * Shown once, gated by localStorage key `fastread_onboarding_complete`.
 *
 * 5 sequential steps:
 *   0. Value Proposition — what is RSVP and why it works
 *   1. Live Demo         — self-contained mini RSVP player (no ReaderContext)
 *   2. Input Methods     — how to load content
 *   3. Reading Profiles  — speed modes available
 *   4. Theme Picker      — choose the app colour scheme
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../styles/OnboardingOverlay.module.css';
import { useReaderContext } from '../context/useReaderContext';
import type { Theme } from '../context/readerContextDef';

// ── Demo content ──────────────────────────────────────────────────────────────

const DEMO_TEXT =
  'Speed reading works by presenting one word at a time at a fixed point on the screen. ' +
  'Your eyes stay still. Your brain does the rest. ' +
  'Most readers improve by thirty to fifty percent within one week of regular practice.';

const DEMO_WORDS = DEMO_TEXT.split(/\s+/).filter(Boolean);
const DEMO_WPM = 300;
const DEMO_INTERVAL_MS = Math.round(60_000 / DEMO_WPM);

// ── Reading profiles data ─────────────────────────────────────────────────────

const PROFILES: { dot: string; label: string; wpm: number; desc: string; recommended?: boolean }[] = [
  { dot: '#e74c3c', label: 'Max Speed',   wpm: 700, desc: 'Triage documents at a glance' },
  { dot: '#e67e22', label: 'Sprint',      wpm: 500, desc: 'Push your speed limits' },
  { dot: '#27ae60', label: 'Balanced',    wpm: 300, desc: 'Your everyday reading mode', recommended: true },
  { dot: '#2980b9', label: 'Deep Focus',  wpm: 180, desc: 'Textbooks & reports' },
  { dot: '#8e44ad', label: 'Zen',         wpm: 100, desc: 'Poetry & reflective reading' },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0); // 0–4
  const [visible, setVisible] = useState(false); // drives enter animation

  const { theme, setTheme } = useReaderContext();

  // Theme picker state — initialised from context theme (single source of truth)
  const [selectedTheme, setSelectedTheme] = useState<Theme>(theme);

  // Demo state — managed by event handlers, not effects
  const [demoIndex, setDemoIndex] = useState(-1); // -1 = not yet started
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Trigger CSS enter animation on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Demo playback helpers ──────────────────────────────────────────────────

  /** Clear any running interval. Pure cleanup — does not set any state. */
  const clearDemoInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Start (or restart) the demo.
   * Called only from event handlers, never from effect bodies.
   */
  const launchDemo = useCallback(() => {
    clearDemoInterval();
    setDemoIndex(0);
    intervalRef.current = setInterval(() => {
      setDemoIndex((prev) => {
        const next = prev + 1;
        if (next >= DEMO_WORDS.length) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return prev; // stay on the last word
        }
        return next;
      });
    }, DEMO_INTERVAL_MS);
  }, [clearDemoInterval]);

  // Stop the interval on unmount (safety net)
  useEffect(() => () => clearDemoInterval(), [clearDemoInterval]);

  const replayDemo = useCallback(() => {
    launchDemo();
  }, [launchDemo]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const advance = useCallback(() => {
    if (step < 4) {
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep === 1) {
        launchDemo(); // start demo when entering step 1 (event handler — not effect)
      } else {
        clearDemoInterval(); // stop demo when leaving step 1
      }
    } else {
      localStorage.setItem('fastread_theme', selectedTheme);
      setTheme(selectedTheme);
      onComplete();
    }
  }, [step, onComplete, launchDemo, clearDemoInterval, selectedTheme, setTheme]);

  const skip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // ── Keyboard navigation ───────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') advance();
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, skip]);

  // ── Derived display values ────────────────────────────────────────────────

  const demoWord = demoIndex >= 0 && demoIndex < DEMO_WORDS.length
    ? DEMO_WORDS[demoIndex]
    : '';

  const demoFinished = demoIndex === DEMO_WORDS.length - 1;

  // Brand logo — switches with selected theme
  const iconSrc = selectedTheme === 'day' ? '/icons/icon-day.svg' : '/icons/icon-night.svg';

  // Theme picker — apply preview as user hovers/selects
  const handleThemeSelect = (t: Theme) => {
    setSelectedTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to ReadSwift"
    >
      <div className={styles.panel}>

        {/* ── Step indicator ── */}
        <div className={styles.dots} aria-label={`Step ${step + 1} of 5`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === step ? styles.dotActive : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* ── Step content ── */}
        <div className={styles.stepContent} key={step}>

          {/* ── Step 0: Value Proposition ── */}
          {step === 0 && (
            <div className={styles.step}>
              <img src={iconSrc} className={styles.brandLogo} width={48} height={48} alt="" aria-hidden="true" />
              <p className={styles.brandName}>ReadSwift</p>
              <h1 className={styles.heading}>Read 2× faster. Same comprehension.</h1>
              <p className={styles.body}>
                ReadSwift uses RSVP — Rapid Serial Visual Presentation — to eliminate eye movement,
                the&nbsp;#1 bottleneck in reading speed.
              </p>
              <p className={styles.subtext}>
                Most people read 200–250 words per minute. ReadSwift users reach 400–600&nbsp;WPM
                in their first week.
              </p>
            </div>
          )}

          {/* ── Step 1: Live Demo ── */}
          {step === 1 && (
            <div className={styles.step}>
              <h1 className={styles.heading}>See it in action</h1>
              <div className={styles.demoContainer} aria-live="polite" aria-atomic="true">
                {demoIndex === -1 ? (
                  <span className={styles.demoPlaceholder}>Get ready\u2026</span>
                ) : (
                  <span className={styles.demoWord}>{demoWord}</span>
                )}
              </div>
              <p className={styles.demoCaption}>
                {demoFinished
                  ? 'That\u2019s RSVP. Your eyes stayed still the whole time.'
                  : `${DEMO_WPM} WPM \u2014 words appear one at a time`}
              </p>
            </div>
          )}

          {/* ── Step 2: Input Methods ── */}
          {step === 2 && (
            <div className={styles.step}>
              <h1 className={styles.heading}>Load any document</h1>
              <ul className={styles.inputList}>
                <li className={styles.inputItem}>
                  <span className={styles.inputIcon}>📂</span>
                  <div>
                    <strong>Upload a file</strong>
                    <span className={styles.inputFormats}> — PDF, EPUB, DOCX, TXT, MD, HTML, RTF, SRT</span>
                  </div>
                </li>
                <li className={styles.inputItem}>
                  <span className={styles.inputIcon}>📋</span>
                  <div>
                    <strong>Paste text</strong>
                    <span className={styles.inputFormats}> — Copy from anywhere, paste directly</span>
                  </div>
                </li>
                <li className={styles.inputItem}>
                  <span className={styles.inputIcon}>🔗</span>
                  <div>
                    <strong>Enter a URL</strong>
                    <span className={styles.inputFormats}> — Fetch any web article</span>
                  </div>
                </li>
              </ul>
              <p className={styles.privacy}>
                🔒 All processing happens on your device. Nothing is uploaded. No account needed.
              </p>
            </div>
          )}

          {/* ── Step 3: Reading Profiles ── */}
          {step === 3 && (
            <div className={styles.step}>
              <h1 className={styles.heading}>Pick your reading style</h1>
              <div className={styles.profileList}>
                {PROFILES.map((p) => (
                  <div
                    key={p.label}
                    className={`${styles.profileCard} ${p.recommended ? styles.profileCardRecommended : ''}`}
                    style={{ borderLeftColor: p.dot }}
                  >
                    <span className={styles.profileDot} style={{ background: p.dot }} />
                    <div className={styles.profileInfo}>
                      <span className={styles.profileLabel}>
                        {p.label}
                        {p.recommended && <span className={styles.profileBadge}>Recommended</span>}
                      </span>
                      <span className={styles.profileWpm}>{p.wpm} WPM</span>
                      <span className={styles.profileDesc}>{p.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className={styles.profileNote}>You can switch modes anytime from the ☰ menu.</p>
            </div>
          )}

          {/* ── Step 4: Theme Picker ── */}
          {step === 4 && (
            <div className={styles.step}>
              <h1 className={styles.heading}>Make it yours</h1>
              <p className={styles.subtext}>
                Choose the look that&rsquo;s easiest on your eyes. You can change this anytime.
              </p>
              <div className={styles.themeCards}>
                {(
                  [
                    { id: 'midnight' as Theme, label: 'Midnight', tagline: 'Default dark theme',    bg: '#0f0f12', border: '#2e2e3e' },
                    { id: 'warm'     as Theme, label: 'Warm',     tagline: 'Easy on the eyes',      bg: '#120f0a', border: '#3a2e20' },
                    { id: 'day'      as Theme, label: 'Day',      tagline: 'High contrast light',   bg: '#f5f0e8', border: '#d0c8bc' },
                  ] satisfies { id: Theme; label: string; tagline: string; bg: string; border: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.themeCard} ${selectedTheme === t.id ? styles.themeCardSelected : ''}`}
                    onClick={() => handleThemeSelect(t.id)}
                    aria-pressed={selectedTheme === t.id}
                  >
                    <span
                      className={styles.themeSwatch}
                      style={{ background: t.bg, borderColor: t.border }}
                      aria-hidden="true"
                    />
                    <span className={styles.themeCardLabel}>{t.label}</span>
                    <span className={styles.themeCardTagline}>{t.tagline}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Action buttons ── */}
        <div className={styles.actions}>
          {step === 1 && (
            <button className={styles.btnSecondary} onClick={replayDemo}>
              Replay
            </button>
          )}

          {step < 4 ? (
            <button className={styles.btnPrimary} onClick={advance}>
              Next →
            </button>
          ) : (
            <button className={`${styles.btnPrimary} ${styles.btnPrimaryReady}`} onClick={advance}>
              Start Reading →
            </button>
          )}

          <button className={styles.btnSkip} onClick={skip}>
            Skip
          </button>
        </div>

      </div>
    </div>
  );
}
