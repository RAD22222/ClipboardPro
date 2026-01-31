
import { FileMetadata, FileChunk } from '../types';

export const CHUNK_SIZE = 64 * 1024; // 64KB chunks

export const splitFileIntoChunks = async (
  file: File,
  onChunk: (chunk: FileChunk) => void
): Promise<FileMetadata> => {
  const id = crypto.randomUUID();
  const chunkCount = Math.ceil(file.size / CHUNK_SIZE);
  
  const metadata: FileMetadata = {
    id,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    chunkCount
  };

  for (let i = 0; i < chunkCount; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const blob = file.slice(start, end);
    
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    onChunk({
      id,
      index: i,
      data: base64
    });
  }

  return metadata;
};

export const assembleChunks = (chunks: string[], mimeType: string): Blob => {
  const byteArrays = chunks.map(base64 => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  });
  
  return new Blob(byteArrays, { type: mimeType });
};
