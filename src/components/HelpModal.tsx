/**
 * HelpModal — "How to Use"
 *
 * 3-tab layout: Quick Start · All Features · Shortcuts
 * Tone: clear, direct, action-oriented.
 */

import { Fragment, useState, useRef } from 'react';
import styles from '../styles/HelpModal.module.css';

interface HelpModalProps {
  onClose: () => void;
}

type ActiveTab = 'quickstart' | 'features' | 'shortcuts';

interface AccordionSection {
  id: string;
  emoji: string;
  title: string;
  items: string[];
}

const ACCORDION_SECTIONS: AccordionSection[] = [
  {
    id: 'upload',
    emoji: '📂',
    title: 'Upload or Paste Content',
    items: [
      'Click 📂 Upload File to open a PDF, EPUB, TXT, MD, HTML, RTF, SRT, or DOCX (up to 100 MB).',
      'Click 📋 Paste / URL to paste text directly or enter a web URL to fetch an article.',
      'Click a title in Reading History to resume exactly where you left off.',
    ],
  },
  {
    id: 'speed',
    emoji: '🎚️',
    title: 'Adjust Reading Speed',
    items: [
      'Drag the speed slider or click − / + to change WPM (60 – 1500).',
      'Start at 200 – 300 WPM and increase gradually each session.',
      'Use keyboard: ↑ to go faster, ↓ to go slower.',
    ],
  },
  {
    id: 'start',
    emoji: '▶',
    title: 'Start Reading',
    items: [
      'Press ▶ Play or tap Space to begin.',
      'Press Space again, click ⏸, or tap the reading area to pause. Your position is saved automatically.',
      'Click ↩ to restart from the beginning at any time.',
    ],
  },
  {
    id: 'navigate',
    emoji: '🧭',
    title: 'Navigate Pages or Words',
    items: [
      'Use ← / → to step word by word, or click ‹ › in the controls.',
      'Click the progress bar to jump to any position in the text.',
      'Click the word counter (e.g. 42 / 3000), type a number, and press Enter to jump directly.',
      'For PDFs and EPUBs, use the page/chapter navigator to jump to any section.',
    ],
  },
  {
    id: 'customize',
    emoji: '⚙️',
    title: 'Customize the Display',
    items: [
      'Open the ☰ menu to adjust window size (1 – 5 words), orientation, and highlight colour.',
      'Use Window size to read 1–5 words at once — higher counts give more context, lower counts maximise focus.',
      'Use Chunk mode: Fixed groups by exact window size, Intelligent forms natural phrase-length chunks.',
      'Use Font size (60 – 200 %) to scale the main reading word independently.',
      'Enable ORP to highlight the focal letter in each word and guide your eye.',
      'Enable Peripheral fade to dim surrounding words so the focal word stands out.',
      'Enable Long-word compensation to add a small pause for unusually long words.',
      'Enable Punctuation pause to add natural pauses after sentence-ending marks.',
      'Click ☀ or 🌙 in the top-right corner to toggle Day / Night mode.',
      'Click ⊞ on the viewport to enter distraction-free focus mode.',
    ],
  },
  {
    id: 'history',
    emoji: '📚',
    title: 'Resume from Reading History',
    items: [
      'Every document is saved automatically with your last position, word count, and date.',
      'Open Reading History in the menu, then click ↩ Resume next to a title.',
      'Re-upload the file when prompted — ReadSwift will restore your exact position.',
    ],
  },
];

const SHORTCUTS = [
  { key: 'Space', action: 'Play / Pause' },
  { key: '←', action: 'Previous word' },
  { key: '→', action: 'Next word' },
  { key: '↑', action: 'Increase speed (×1.2)' },
  { key: '↓', action: 'Decrease speed (÷1.2)' },
  { key: 'Esc', action: 'Close panels / exit focus' },
];

export default function HelpModal({ onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('quickstart');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['upload']));
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const lowerQuery = searchQuery.toLowerCase();
  const filteredSections = lowerQuery
    ? ACCORDION_SECTIONS.filter(
        (s) =>
          s.title.toLowerCase().includes(lowerQuery) ||
          s.items.some((item) => item.toLowerCase().includes(lowerQuery)),
      )
    : ACCORDION_SECTIONS;

  return (
    /* Backdrop — click outside to close */
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="How to Use ReadSwift"
      >
        {/* ── Header ── */}
        <div className={styles.header}>
          <h2 className={styles.title}>📖 How to Use ReadSwift</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close help">
            ✕
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className={styles.tabBar} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'quickstart'}
            className={`${styles.tabBtn}${activeTab === 'quickstart' ? ` ${styles.tabBtnActive}` : ''}`}
            onClick={() => setActiveTab('quickstart')}
          >
            <span className={styles.tabIcon}>📖</span>
            <span className={styles.tabLabel}>Quick Start</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'features'}
            className={`${styles.tabBtn}${activeTab === 'features' ? ` ${styles.tabBtnActive}` : ''}`}
            onClick={() => {
              setActiveTab('features');
              setTimeout(() => searchRef.current?.focus(), 50);
            }}
          >
            <span className={styles.tabIcon}>🗂️</span>
            <span className={styles.tabLabel}>All Features</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'shortcuts'}
            className={`${styles.tabBtn}${activeTab === 'shortcuts' ? ` ${styles.tabBtnActive}` : ''}`}
            onClick={() => setActiveTab('shortcuts')}
          >
            <span className={styles.tabIcon}>⌨️</span>
            <span className={styles.tabLabel}>Shortcuts</span>
          </button>
        </div>

        {/* ── Tab panels ── */}
        <div className={styles.body}>

          {/* ── Tab 1: Quick Start ── */}
          {activeTab === 'quickstart' && (
            <div role="tabpanel" className={styles.tabPanel}>
              <div className={styles.stepCard}>
                <div className={styles.stepIconCircle}>📂</div>
                <div className={styles.stepText}>
                  <strong className={styles.stepLabel}>1. Load Content</strong>
                  <span>Upload a PDF, EPUB, DOCX, or any text file — or paste text / a URL directly.</span>
                </div>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepIconCircle}>🎚️</div>
                <div className={styles.stepText}>
                  <strong className={styles.stepLabel}>2. Set Speed</strong>
                  <span>Drag the speed slider to your target WPM — start at 200–300 and build up gradually.</span>
                </div>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepIconCircle}>▶</div>
                <div className={styles.stepText}>
                  <strong className={styles.stepLabel}>3. Play</strong>
                  <span>Press the Play button or hit Space — words flash one at a time at your chosen speed.</span>
                </div>
              </div>
              <p className={styles.quickStartTip}>
                Tip: Click the <strong>?</strong> button anytime to reopen this guide.
              </p>
            </div>
          )}

          {/* ── Tab 2: All Features ── */}
          {activeTab === 'features' && (
            <div role="tabpanel" className={styles.tabPanel}>
              <input
                ref={searchRef}
                className={styles.searchInput}
                type="search"
                placeholder="Search features…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search features"
              />
              {filteredSections.length === 0 && (
                <p className={styles.noResults}>No results for &ldquo;{searchQuery}&rdquo;</p>
              )}
              {filteredSections.map((section) => {
                const isOpen = openSections.has(section.id);
                return (
                  <div key={section.id} className={styles.accordion}>
                    <button
                      className={styles.accordionHeader}
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={isOpen}
                    >
                      <span className={styles.accordionTitle}>
                        {section.emoji} {section.title}
                      </span>
                      <span
                        className={`${styles.accordionChevron}${isOpen ? ` ${styles.accordionChevronOpen}` : ''}`}
                        aria-hidden="true"
                      >
                        ›
                      </span>
                    </button>
                    {isOpen && (
                      <ul className={styles.accordionBody}>
                        {section.items.map((item, idx) => (
                          <li key={idx} className={styles.featureRow}>
                            <span className={styles.featureDot} aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Tab 3: Shortcuts ── */}
          {activeTab === 'shortcuts' && (
            <div role="tabpanel" className={styles.tabPanel}>
              <div className={styles.shortcutGrid}>
                {SHORTCUTS.map(({ key, action }) => (
                  <Fragment key={key}>
                    <kbd className={styles.kbdKey}>{key}</kbd>
                    <span className={styles.shortcutAction}>{action}</span>
                  </Fragment>
                ))}
              </div>
              <p className={styles.note}>
                Shortcuts are inactive when a text field is focused.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

