import { useState } from 'react';
import styles from './HelpSheet.module.css';

type Tab = 'start' | 'features' | 'tips';
interface Item { icon: string; title: string; summary: string; detail?: string }

const DATA: { [k in Tab]: Item[] } = {
  start: [
    { icon: '📂', title: 'Upload a file', summary: 'Tap UPLOAD to load a .txt or .epub file.', detail: 'Supported: .txt .epub .pdf. App splits into words, starts from beginning.' },
    { icon: '📋', title: 'Paste text', summary: 'Tap PASTE to open the paste sheet.', detail: 'Type or paste text, check word count, tap "Start Reading". Does not auto-play.' },
    { icon: '▶', title: 'Start reading', summary: 'Press PLAY. Words flash one at a time at your speed.', detail: 'RSVP shows words at a fixed point so eyes never move. Increases reading speed.' },
    { icon: '⚡', title: 'Set your speed', summary: 'Drag the slider or tap − / + to change WPM.', detail: '250 WPM = natural pace. 300–400 WPM reachable with practice. Start slow.' },
  ],
  features: [
    { icon: '⏮', title: 'Back & Next', summary: 'Skip one sentence backward or forward.', detail: 'Back = start of current sentence. Next = start of next.' },
    { icon: '↺', title: 'Reset', summary: 'Jump to the beginning. Text stays loaded.' },
    { icon: '📄', title: 'Page navigation', summary: 'Tap ‹ p.2/967 › in the reading area to change pages.', detail: 'Tap the page pill to enter a page number directly.' },
    { icon: '🎯', title: 'ORP — Key letter', summary: "Coloured letter = your eye's anchor point.", detail: 'Optimal Recognition Point lets the brain process each word instantly. Keep eyes at tick marks.' },
    { icon: '|', title: 'Focal line', summary: 'Tick marks show where the key letter always lands.', detail: 'Every word is aligned so the key letter passes this exact point.' },
    { icon: '📖', title: 'Reading Modes', summary: 'Speed / Focus / Read / Custom — preset setting bundles.', detail: 'Speed⚡ pure velocity. Focus🎯 ORP+focal line. Read📖 3 words natural. Custom⚙️ your settings.' },
    { icon: '123', title: 'Words at once', summary: 'Show 1, 2, or 3 words per flash.', detail: '1 = fastest. 2–3 = more natural feel and better comprehension.' },
    { icon: '🌫', title: 'Dim upcoming words', summary: 'Fades context words so eye stays on main word.' },
    { icon: '⏸', title: 'Pause at punctuation', summary: 'Brief delay after . ! ? to aid comprehension.' },
    { icon: '📜', title: 'Context strip', summary: 'Strip at bottom of reading card. Tap to expand.', detail: 'Shows surrounding text. Current word is highlighted in accent colour.' },
    { icon: '🎨', title: 'Themes', summary: 'Midnight · Warm · Day in Settings → Display.', detail: 'Midnight dark/blue. Warm dark-brown/amber lowest fatigue. Day light/teal best for sunlight.' },
    { icon: '♿', title: 'Color-blind ORP', summary: 'Switches key letter to cyan — safe for all vision types.' },
  ],
  tips: [
    { icon: '🐢', title: 'Start slow', summary: 'Begin at 250 WPM, increase 25 WPM per session.', detail: 'Rushing to 500 WPM immediately reduces comprehension to near zero.' },
    { icon: '👁', title: 'Lock your gaze', summary: 'Keep eyes still. Let words come to you.', detail: 'Traditional reading = 3–4 eye movements per line. RSVP eliminates them all.' },
    { icon: '⏱', title: 'Short sessions first', summary: 'Start 5–10 min. RSVP is cognitively intense.', detail: 'App reminds you after 20 min of continuous reading.' },
    { icon: '🧠', title: 'Test yourself', summary: 'After reading, recall what you read without looking.', detail: 'Active recall fastest way to build comprehension at speed.' },
    { icon: '🎯', title: 'Focus mode for new content', summary: 'ORP + focal line helps on unfamiliar text.', detail: 'Focus at 250 WPM beats Speed at 400 WPM for technical or academic content.' },
    { icon: '📖', title: 'Read mode for fiction', summary: '3-word mode preserves narrative rhythm and flow.' },
    { icon: '☀️', title: 'Match theme to environment', summary: 'Midnight/Warm for dark rooms. Day for bright light.', detail: 'Bright screen in dark room increases eye fatigue.' },
  ],
};

export const HelpSheet = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [tab, setTab] = useState<Tab>('start');
  const [open, setOpen] = useState<number | null>(null);
  const items = DATA[tab];

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <span className={styles.title}>How to use ReadSwift</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className={styles.tabs}>
          {(['start', 'features', 'tips'] as Tab[]).map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => { setTab(t); setOpen(null); }}
            >
              {t === 'start' ? '🚀 Start' : t === 'features' ? '⚙️ Features' : '💡 Tips'}
            </button>
          ))}
        </div>
        <div className={styles.content}>
          {items.map((item, i) => (
            <div
              key={i}
              className={`${styles.card} ${open === i ? styles.cardOpen : ''}`}
              onClick={() => item.detail && setOpen(p => p === i ? null : i)}
              role={item.detail ? 'button' : undefined}
            >
              <div className={styles.cardMain}>
                <span className={styles.icon}>{item.icon}</span>
                <div className={styles.cardText}>
                  <span className={styles.cardTitle}>{item.title}</span>
                  <span className={styles.cardSummary}>{item.summary}</span>
                </div>
                {item.detail && <span className={styles.chevron}>{open === i ? '▲' : '▼'}</span>}
              </div>
              {item.detail && open === i && (
                <div className={styles.detail}>
                  {item.detail.split('\n').map((l, j) => <p key={j}>{l}</p>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
