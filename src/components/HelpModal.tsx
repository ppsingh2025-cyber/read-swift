/**
 * HelpModal — iOS Settings-style reference list with two tabs.
 * Tab 1 "How to use": feature reference (Getting Started, Playback & Navigation,
 *   Display & Modes, Tips & Shortcuts)
 * Tab 2 "Training guide": Speed Training Guide coaching content.
 * Default tab on open: "How to use".
 */
import { useRef, useState } from 'react';
import styles from '../styles/HelpModal.module.css';

interface HelpModalProps { onClose: () => void; }
interface HelpItem { icon: string; color: string; title: string; desc: string; }
interface HelpSection { heading: string; items: HelpItem[]; }

const SECTIONS: HelpSection[] = [
  {
    heading: 'Speed Training Guide',
    items: [
      { icon: '🎯', color: '#4a7a6a', title: 'Set honest expectations',   desc: 'Most people reach 350–450 WPM with good comprehension after 4–6 weeks of consistent daily practice — roughly 1.5–2× their starting speed. Claims of 1000+ WPM with full retention are not supported by research. The goal is meaningful improvement, not miracles.' },
      { icon: '📏', color: '#5a6a8a', title: 'Find your baseline first',   desc: 'Before going faster, find the speed where you read comfortably and recall what you just read. For most people this is 200–250 WPM. This is your starting floor, not a ceiling. Every session begins here.' },
      { icon: '👁',  color: '#4a4a7a', title: 'Master the gaze first',    desc: 'The single most important RSVP habit is keeping your eyes completely still on the focal point — the tick marks and ORP letter. Spend your entire first week on this one habit at comfortable WPM. Every speed gain after this builds on it.' },
      { icon: '⚡', color: '#8a6a20', title: 'Increase gradually',         desc: 'Once your gaze holds and you can recall what you read, increase WPM by 25–50 per session using the slider or − / + buttons. Do not jump multiple levels at once. The brain adapts to incremental overload, not shock.' },
      { icon: '💬', color: '#5a4a7a', title: 'Subvocalization is normal', desc: 'You will still hear words in your head at higher speeds, and that is fine. Even expert speed readers subvocalize — they just do it faster. RSVP naturally encourages this by presenting words faster than you can speak them aloud.' },
      { icon: '📊', color: '#4a7a5a', title: 'Test comprehension',         desc: 'After each section, pause and try to recall three specific things you just read. If you can\'t, drop 25 WPM next session. A good heuristic: if you follow roughly 80% of the meaning, your speed is well calibrated.' },
      { icon: '📅', color: '#6a4a7a', title: 'Short sessions, every day', desc: '5–10 minutes of focused daily practice outperforms 30 minutes once a week. RSVP is cognitively intense at higher speeds — shorter sessions keep quality high. Consistency over weeks is the only thing that produces lasting gains.' },
      { icon: '📖', color: '#4a6a4a', title: 'Train on easy material',     desc: 'Train on familiar, easy content: news articles, light non-fiction, genres you know well. Save technical documents and complex arguments for reading to understand, not to build speed. Hard material at speed destroys both.' },
    ],
  },
  {
    heading: 'Getting Started',
    items: [
      { icon: '📂', color: '#4a7fa0', title: 'Upload a file',      desc: 'Tap UPLOAD to load a PDF, EPUB, TXT, MD, HTML, RTF, SRT, or DOCX (up to 100 MB).' },
      { icon: '📋', color: '#7a6fa0', title: 'Paste text or URL',  desc: 'Tap PASTE to open the text panel. Paste directly or enter a URL to fetch an article.' },
      { icon: '▶',  color: '#3a8f5a', title: 'Press Play',         desc: 'Tap PLAY or press Space. Words flash one at a time at your chosen speed.' },
      { icon: '⚡', color: '#b87a20', title: 'Set your speed',     desc: 'Drag the slider or tap − / + to adjust WPM. Start at 200–300 and increase gradually.' },
    ],
  },
  {
    heading: 'Playback & Navigation',
    items: [
      { icon: '⏮',  color: '#4a6a8a', title: 'Back & Next',          desc: 'Step one word backward or forward. Keyboard: ← and →.' },
      { icon: '↩',  color: '#7a4a4a', title: 'Reset',                 desc: 'Returns to word 0. Your text stays loaded.' },
      { icon: '📄', color: '#4a5a7a', title: 'Page navigation',       desc: 'For PDFs and EPUBs, use − p.2/967 + in the info row. Tap the page pill to type any page number.' },
      { icon: '#',  color: '#4a7a6a', title: 'Jump to any word',      desc: 'Click the word counter (e.g. 42 / 3000), type a number, press Enter.' },
      { icon: '▸',  color: '#5a6a7a', title: 'Context preview',       desc: 'The panel below the controls shows surrounding text. The ▸ cursor marks your exact reading word. Click a page pill to jump directly to any page.' },
    ],
  },
  {
    heading: 'Display & Modes',
    items: [
      { icon: '☰',  color: '#3a6a7a', title: 'Reading modes',         desc: 'Open ☰ and choose a Reading Mode preset. Each bundles optimal settings for that goal.' },
      { icon: '⚡', color: '#5a4a7a', title: 'Custom modes',          desc: 'Fine-tune → Name & save → Creates a personal preset tile. Edit any setting and tap "Update" to save changes.' },
      { icon: '🎯', color: '#8a4a4a', title: 'ORP — Key letter',      desc: 'The coloured letter is your eye\'s anchor. Keep your gaze on the tick marks — words come to you.' },
      { icon: '|',  color: '#6a6a8a', title: 'Focal line',            desc: 'Tick marks show where the key letter always lands. Train your eye to rest here before pressing Play.' },
      { icon: '1',  color: '#5a7a4a', title: 'Words at once',         desc: '1 word = maximum focus. 2–5 words = more natural flow. Set under Fine-tune in Reading Mode.' },
      { icon: '🌫', color: '#5a5a7a', title: 'Peripheral fade',       desc: 'Dims context words so the main word stands out. Enable in Fine-tune under Reading Mode.' },
      { icon: '⊞',  color: '#4a5a6a', title: 'Focus mode',           desc: 'Tap ⊞ on the viewport for fullscreen — word and tick marks only, no UI.' },
      { icon: '🎨', color: '#7a5a3a', title: 'Themes',               desc: 'Midnight · Warm · Day · Obsidian. Switch in ☰ → Display. Midnight and Obsidian reduce eye fatigue on OLED.' },
      { icon: '☀',  color: '#7a6a3a', title: 'Theme toggle',         desc: 'Also available as ☀ / 🌙 button in the top-right corner for quick switching.' },
    ],
  },
  {
    heading: 'Tips & Shortcuts',
    items: [
      { icon: '🐢', color: '#4a7a4a', title: 'Start slow',            desc: 'Begin at 200–300 WPM. Increase by 25 WPM each session. Rushing destroys comprehension.' },
      { icon: '👁',  color: '#4a4a7a', title: 'Lock your gaze',      desc: 'Keep eyes completely still on the tick marks. RSVP brings words to you — never chase them.' },
      { icon: '📊', color: '#5a7a6a', title: 'Session analytics',    desc: 'Open ☰ → Session Analytics to see words read, time, WPM, and past sessions with one-tap resume.' },
      { icon: '↺',  color: '#4a6a7a', title: 'Resume reading',       desc: 'Open ☰ → Session Analytics → Past sessions. The 3 most recently opened files (under 25 MB) and all pasted or fetched text sessions show "↩ Resume" and load instantly. Older file entries show "↩ Select file to resume" — re-open the original file and your position restores automatically.' },
      { icon: '💾', color: '#4a6a8a', title: 'Auto-save cache',       desc: 'PaceRead saves your last 3 opened files (under 25 MB) and all pasted or fetched text locally for instant resume. When you open a 4th file, the oldest cached file is removed and you\'ll see a notification. Files over 25 MB require re-selecting the file to resume. Removing a session from history also removes it from the cache.' },
      { icon: '⌨',  color: '#5a4a7a', title: 'Keyboard shortcuts',   desc: 'Space: Play/Pause  ·  ← →: Step words  ·  ↑ ↓: Speed  ·  F: Toggle focus mode  ·  Esc: Close panels' },
      { icon: '👆', color: '#4a6a7a', title: 'Touch gestures (mobile)', desc: 'Swipe left: speed up  ·  Swipe right: slow down  ·  Swipe up: play/pause  ·  Tap viewport: play/pause  ·  Note: swiping from the screen\'s left edge triggers OS back navigation (not a bug).' },
      { icon: '⏱',  color: '#7a4a6a', title: 'Short sessions first', desc: 'RSVP is cognitively intense. Build from 5–10 min sessions before attempting long reads.' },
    ],
  },
];

// "How to use" tab: all sections except Speed Training Guide
const HOW_TO_USE_SECTIONS = SECTIONS.filter(s => s.heading !== 'Speed Training Guide');
// "Training guide" tab: Speed Training Guide only
const TRAINING_SECTIONS = SECTIONS.filter(s => s.heading === 'Speed Training Guide');

type TabId = 'how-to-use' | 'training';

export default function HelpModal({ onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('how-to-use');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const visibleSections = activeTab === 'how-to-use' ? HOW_TO_USE_SECTIONS : TRAINING_SECTIONS;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="How to use PaceRead"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>How to use PaceRead</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close help">✕</button>
        </div>

        {/* Sticky tab bar */}
        <div className={styles.tabBar} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'how-to-use'}
            className={`${styles.tab} ${activeTab === 'how-to-use' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('how-to-use')}
          >
            How to use
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'training'}
            className={`${styles.tab} ${activeTab === 'training' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('training')}
          >
            Training guide
          </button>
        </div>

        <div className={styles.scroll} ref={scrollRef}>
          {visibleSections.map((section) => (
            <div key={section.heading} className={styles.section}>
              <p className={styles.sectionHeading}>{section.heading}</p>
              {section.items.map((item) => (
                <div key={item.title} className={styles.row}>
                  <span
                    className={styles.iconWrap}
                    style={{ background: item.color + '28', color: item.color }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <div className={styles.rowText}>
                    <span className={styles.rowTitle}>{item.title}</span>
                    <span className={styles.rowDesc}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <p className={styles.version}>PaceRead — Read Faster. Understand Better.</p>
        </div>
      </div>
    </div>
  );
}

