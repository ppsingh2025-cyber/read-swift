import type { PresetModeId, ModeSettings } from '../types/readingModes';

export const PRESET_MODES: Record<PresetModeId, {
  label: string;
  icon: string;
  description: string;
  defaultWpm: number;
  settings: ModeSettings;
}> = {
  speed: {
    label: 'Sprint',
    icon: '⚡',
    description: 'Maximum speed. One word at a time, no anchor, no pauses.',
    defaultWpm: 450,
    settings: {
      windowSize: 1,
      orpEnabled: false,
      orpColored: false,        // pure speed — no visual noise
      focalLine: false,
      peripheralFade: false,
      punctuationPause: false,
      longWordCompensation: false,
      chunkMode: 'fixed',
    },
  },
  focus: {
    label: 'Focus',
    icon: '🎯',
    description: 'Eye anchor + ORP highlight. One word, zero movement.',
    defaultWpm: 250,
    settings: {
      windowSize: 1,
      orpEnabled: true,
      orpColored: true,         // ORP highlight is the focal anchor
      focalLine: true,          // ALWAYS true for Focus
      peripheralFade: false,
      punctuationPause: true,
      longWordCompensation: true,
      chunkMode: 'fixed',
    },
  },
  read: {
    label: 'Flow',
    icon: '🌊',
    description: 'Natural rhythm. Three words, phrase grouping, full context.',
    defaultWpm: 180,
    settings: {
      windowSize: 3,            // 3 words — default (user can adjust up to 5)
      orpEnabled: false,
      orpColored: false,        // context flow — uniform word color
      focalLine: true,          // ticks still useful as anchor in multi-word
      peripheralFade: true,     // uniform 0.45 on context words
      punctuationPause: true,
      longWordCompensation: true,
      chunkMode: 'intelligent',
    },
  },
};
