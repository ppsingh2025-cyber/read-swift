import type { PresetModeId, ModeSettings } from '../types/readingModes';

export const PRESET_MODES: Record<PresetModeId, {
  label: string;
  icon: string;
  description: string;
  settings: ModeSettings;
}> = {
  speed: {
    label: 'Speed',
    icon: '⚡',
    description: 'Pure velocity. No pauses, no distractions.',
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
    label: 'Read',
    icon: '📖',
    description: 'Natural reading with context and rhythm.',
    settings: {
      windowSize: 3,            // 3 words — max (v11)
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
