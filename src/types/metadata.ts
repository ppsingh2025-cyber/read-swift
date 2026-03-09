export interface FileMetadata {
  id?: string;
  userId?: string;
  fileHash: string;
  fileName: string;
  fileType: 'pdf' | 'epub' | 'txt';
  fileSize: number;
  lastWordIndex: number;
  lastPage: number;
  totalPages: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserPreferences {
  id?: string;
  userId?: string;
  theme: 'midnight' | 'warm' | 'day' | 'obsidian';
  fontSize: number;
  wordWindow: 1 | 2 | 3 | 4 | 5;
  highlightColor: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReadingSession {
  id?: string;
  userId?: string;
  fileId?: string;
  sessionStart: Date;
  sessionEnd?: Date;
  wordsRead: number;
  startWordIndex: number;
  endWordIndex?: number;
  deviceName: string;
  createdAt?: Date;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime?: Date;
  isOnline: boolean;
  hasUnsyncedChanges: boolean;
}

export interface StoredSession {
  id: string;           // crypto.randomUUID()
  bookName: string;     // fileMetadata?.name or 'Pasted text'
  startedAt: string;    // ISO 8601
  durationMs: number;
  wordsRead: number;
  avgWpm: number;
}
