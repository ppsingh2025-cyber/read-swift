import type { WindowSize, ChunkMode } from '../context/readerContextDef';

export type PresetModeId = 'speed' | 'focus' | 'read';
export type ModeId = PresetModeId | 'custom';

export interface ModeSettings {
  windowSize: WindowSize;
  orpEnabled: boolean;
  orpColored: boolean;
  focalLine: boolean;
  peripheralFade: boolean;
  punctuationPause: boolean;
  longWordCompensation: boolean;
  chunkMode: ChunkMode;
  contextWordFontSize: number;   // 0 = same as main word; 70–180 = explicit scale %
  contextWordOpacity: number;
}

export interface CustomMode {
  id: string;
  name: string;       // user-provided, max 20 chars
  settings: ModeSettings;
  wpm?: number;       // optional — applied when mode is activated
  createdAt: string;  // ISO 8601
}
