/**
 * HelpModal — iOS Settings-style reference list.
 * Single scroll, 4 sections, every item always visible.
 * No tabs, no accordions, no expand/collapse.
 */
import styles from '../styles/HelpModal.module.css';

interface HelpModalProps { onClose: () => void; }
interface HelpItem { icon: string; color: string; title: string; desc: string; }
interface HelpSection { heading: string; items: HelpItem[]; }

const SECTIONS: HelpSection[] = [
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
      { icon: '📜', color: '#5a6a7a', title: 'Context preview',       desc: 'The panel below the viewport shows surrounding text. Tap to see more context.' },
    ],
  },
  {
    heading: 'Display & Modes',
    items: [
      { icon: '☰',  color: '#3a6a7a', title: 'Reading modes',         desc: 'Open ☰ and choose a Reading Mode preset. Each bundles optimal settings for that goal.' },
      { icon: '🎯', color: '#8a4a4a', title: 'ORP — Key letter',      desc: 'The coloured letter is your eye\'s anchor. Keep your gaze on the tick marks — words come to you.' },
      { icon: '|',  color: '#6a6a8a', title: 'Focal line',            desc: 'Tick marks show where the key letter always lands. Train your eye to rest here before pressing Play.' },
      { icon: '1',  color: '#5a7a4a', title: 'Words at once',         desc: '1 word = maximum focus. 2–3 words = more natural flow. Set under Display in ☰.' },
      { icon: '🌫', color: '#5a5a7a', title: 'Peripheral fade',       desc: 'Dims context words so the main word stands out. Enable under Reading Features in ☰.' },
      { icon: '⊞',  color: '#4a5a6a', title: 'Focus mode',           desc: 'Tap ⊞ on the viewport for fullscreen — word and tick marks only, no UI.' },
      { icon: '🎨', color: '#7a5a3a', title: 'Themes',               desc: 'Midnight · Warm · Day. Switch in ☰ → Display. Midnight and Warm reduce eye fatigue.' },
      { icon: '☀',  color: '#7a6a3a', title: 'Theme toggle',         desc: 'Also available as ☀ / 🌙 button in the top-right corner for quick switching.' },
    ],
  },
  {
    heading: 'Tips & Shortcuts',
    items: [
      { icon: '🐢', color: '#4a7a4a', title: 'Start slow',            desc: 'Begin at 200–300 WPM. Increase by 25 WPM each session. Rushing destroys comprehension.' },
      { icon: '👁',  color: '#4a4a7a', title: 'Lock your gaze',      desc: 'Keep eyes completely still on the tick marks. RSVP brings words to you — never chase them.' },
      { icon: '↺',  color: '#4a6a7a', title: 'Resume reading',       desc: 'Open ☰ → Reading History → Resume. Re-upload the file when prompted. Exact word restored.' },
      { icon: '⌨',  color: '#5a4a7a', title: 'Keyboard shortcuts',   desc: 'Space: Play/Pause  ·  ← →: Step words  ·  ↑ ↓: Speed  ·  Esc: Close panels' },
      { icon: '⏱',  color: '#7a4a6a', title: 'Short sessions first', desc: 'RSVP is cognitively intense. Build from 5–10 min sessions before attempting long reads.' },
    ],
  },
];

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="How to use ReadSwift"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>How to use ReadSwift</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close help">✕</button>
        </div>

        <div className={styles.scroll}>
          {SECTIONS.map((section) => (
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
          <p className={styles.version}>ReadSwift — Speed Reading Tool</p>
        </div>
      </div>
    </div>
  );
}

