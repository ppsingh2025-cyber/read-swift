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
}

export interface CustomMode {
  id: string;
  name: string;       // user-provided, max 20 chars
  settings: ModeSettings;
  createdAt: string;  // ISO 8601
}
