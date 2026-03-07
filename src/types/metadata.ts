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
  theme: 'midnight' | 'warm' | 'day';
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
