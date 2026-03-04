/**
 * Reading Profiles
 *
 * Pre-configured bundles of reader settings for common reading modes.
 * Each profile adjusts WPM, window size, chunking, and feature flags.
 * Users can still override any individual setting after applying a profile.
 *
 * Default profile on first launch: Balanced.
 */

import type { WindowSize, Orientation, ChunkMode } from '../context/readerContextDef';

export interface ReadingProfile {
  id: string;
  name: string;
  /** Short description shown as a tooltip */
  description: string;
  wpm: number;
  windowSize: WindowSize;
  orientation: Orientation;
  highlightColor: string;
  chunkMode: ChunkMode;
  peripheralFade: boolean;
  punctuationPause: boolean;
  longWordCompensation: boolean;
  mainWordFontSize: number;
}

export const READING_PROFILES: ReadingProfile[] = [
  {
    id: 'max-speed',
    name: 'Max Speed',
    description: 'High WPM, minimal pauses, single word focus',
    wpm: 600,
    windowSize: 1,
    orientation: 'horizontal',
    highlightColor: '#e74c3c',
    chunkMode: 'fixed',
    peripheralFade: false,
    punctuationPause: false,
    longWordCompensation: false,
    mainWordFontSize: 150,
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Medium speed, normal pauses, 3-word context window',
    wpm: 250,
    windowSize: 3,
    orientation: 'horizontal',
    highlightColor: '#e74c3c',
    chunkMode: 'fixed',
    peripheralFade: true,
    punctuationPause: true,
    longWordCompensation: true,
    mainWordFontSize: 100,
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    description: 'Slower speed, punctuation pauses, strong peripheral fade',
    wpm: 180,
    windowSize: 3,
    orientation: 'horizontal',
    highlightColor: '#3498db',
    chunkMode: 'fixed',
    peripheralFade: true,
    punctuationPause: true,
    longWordCompensation: true,
    mainWordFontSize: 120,
  },
  {
    id: 'comprehension',
    name: 'Comprehension',
    description: 'Slow speed, intelligent phrase grouping, all pauses enabled',
    wpm: 150,
    windowSize: 3,
    orientation: 'horizontal',
    highlightColor: '#2ecc71',
    chunkMode: 'intelligent',
    peripheralFade: true,
    punctuationPause: true,
    longWordCompensation: true,
    mainWordFontSize: 100,
  },
];

export const DEFAULT_PROFILE_ID = 'balanced';
export const LS_KEY_PROFILE = 'fastread_reading_profile';
