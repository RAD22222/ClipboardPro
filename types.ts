
export enum MessageType {
  TEXT = 'TEXT',
  FILE_META = 'FILE_META',
  FILE_CHUNK = 'FILE_CHUNK',
  ACK = 'ACK',
  PING = 'PING'
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  chunkCount: number;
}

export interface FileChunk {
  id: string;
  index: number;
  data: string; // Base64 string
}

export interface DataMessage {
  type: MessageType;
  payload: any;
  senderId: string;
  timestamp: number;
}

export interface ClipboardItem {
  id: string;
  type: 'TEXT' | 'FILE';
  content?: string;
  fileMeta?: FileMetadata;
  status: 'pending' | 'completed' | 'failed';
  progress?: number;
  timestamp: number;
  isIncoming: boolean;
  blob?: Blob;
}

export interface AppSettings {
  sessionOnly: boolean;
  storageLimitMb: number;
  autoDownload: boolean;
}
