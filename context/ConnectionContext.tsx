
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { ClipboardItem, DataMessage, MessageType, FileMetadata, FileChunk } from '../types';
import { splitFileIntoChunks, assembleChunks } from '../utils/chunkHelpers';
import { clipboardService } from '../services/ClipboardService';

interface ConnectionContextProps {
  peerId: string;
  isConnected: boolean;
  connection: DataConnection | null;
  items: ClipboardItem[];
  connectToPeer: (targetId: string) => void;
  sendText: (text: string) => void;
  sendFiles: (files: FileList | File[]) => void;
  clearHistory: () => void;
  deleteItem: (id: string) => void;
}

const ConnectionContext = createContext<ConnectionContextProps | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [peerId, setPeerId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [items, setItems] = useState<ClipboardItem[]>([]);
  
  const peerRef = useRef<Peer | null>(null);
  const activeChunksRef = useRef<Record<string, { chunks: string[]; meta: FileMetadata }>>({});

  useEffect(() => {
    // Initialize history from IndexedDB
    clipboardService.getAllItems().then(setItems);

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id) => setPeerId(id));
    peer.on('connection', (conn) => {
      setupConnection(conn);
    });

    return () => {
      peer.destroy();
    };
  }, []);

  const setupConnection = useCallback((conn: DataConnection) => {
    conn.on('open', () => {
      setIsConnected(true);
      setConnection(conn);
    });

    conn.on('data', (data: any) => {
      handleIncomingData(data);
    });

    conn.on('close', () => {
      setIsConnected(false);
      setConnection(null);
    });

    conn.on('error', (err) => {
      console.error('Peer connection error:', err);
      setIsConnected(false);
      setConnection(null);
    });
  }, []);

  const handleIncomingData = useCallback(async (data: DataMessage) => {
    switch (data.type) {
      case MessageType.TEXT: {
        const newItem: ClipboardItem = {
          id: crypto.randomUUID(),
          type: 'TEXT',
          content: data.payload,
          status: 'completed',
          timestamp: Date.now(),
          isIncoming: true
        };
        setItems(prev => [newItem, ...prev]);
        clipboardService.saveItem(newItem);
        break;
      }
      case MessageType.FILE_META: {
        const meta = data.payload as FileMetadata;
        activeChunksRef.current[meta.id] = { chunks: new Array(meta.chunkCount).fill(''), meta };
        const newItem: ClipboardItem = {
          id: meta.id,
          type: 'FILE',
          fileMeta: meta,
          status: 'pending',
          progress: 0,
          timestamp: Date.now(),
          isIncoming: true
        };
        setItems(prev => [newItem, ...prev]);
        break;
      }
      case MessageType.FILE_CHUNK: {
        const chunk = data.payload as FileChunk;
        const entry = activeChunksRef.current[chunk.id];
        if (entry) {
          entry.chunks[chunk.index] = chunk.data;
          const receivedCount = entry.chunks.filter(c => c !== '').length;
          const progress = Math.round((receivedCount / entry.meta.chunkCount) * 100);

          setItems(prev => prev.map(item => 
            item.id === chunk.id ? { ...item, progress } : item
          ));

          if (receivedCount === entry.meta.chunkCount) {
            const blob = assembleChunks(entry.chunks, entry.meta.mimeType);
            const newItem: ClipboardItem = {
              id: chunk.id,
              type: 'FILE',
              fileMeta: entry.meta,
              status: 'completed',
              progress: 100,
              timestamp: Date.now(),
              isIncoming: true,
              blob: blob
            };
            setItems(prev => prev.map(item => item.id === chunk.id ? newItem : item));
            clipboardService.saveItem(newItem);
            delete activeChunksRef.current[chunk.id];
          }
        }
        break;
      }
    }
  }, []);

  const connectToPeer = useCallback((targetId: string) => {
    if (peerRef.current) {
      const conn = peerRef.current.connect(targetId);
      setupConnection(conn);
    }
  }, [setupConnection]);

  const sendText = useCallback((text: string) => {
    if (connection && isConnected) {
      const msg: DataMessage = {
        type: MessageType.TEXT,
        payload: text,
        senderId: peerId,
        timestamp: Date.now()
      };
      connection.send(msg);
      
      const newItem: ClipboardItem = {
        id: crypto.randomUUID(),
        type: 'TEXT',
        content: text,
        status: 'completed',
        timestamp: Date.now(),
        isIncoming: false
      };
      setItems(prev => [newItem, ...prev]);
      clipboardService.saveItem(newItem);
    }
  }, [connection, isConnected, peerId]);

  const sendFiles = useCallback(async (files: FileList | File[]) => {
    if (!connection || !isConnected) return;

    for (const file of Array.from(files)) {
      const metaId = crypto.randomUUID();
      const metaItem: ClipboardItem = {
        id: metaId,
        type: 'FILE',
        fileMeta: {
          id: metaId,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          chunkCount: 0 // Will be updated by split helper
        },
        status: 'pending',
        progress: 0,
        timestamp: Date.now(),
        isIncoming: false,
        blob: file
      };
      setItems(prev => [metaItem, ...prev]);

      const metadata = await splitFileIntoChunks(file, (chunk) => {
        connection.send({
          type: MessageType.FILE_CHUNK,
          payload: { ...chunk, id: metaId },
          senderId: peerId,
          timestamp: Date.now()
        });
      });

      connection.send({
        type: MessageType.FILE_META,
        payload: { ...metadata, id: metaId },
        senderId: peerId,
        timestamp: Date.now()
      });

      setItems(prev => prev.map(item => 
        item.id === metaId ? { ...item, status: 'completed', progress: 100, fileMeta: { ...metadata, id: metaId } } : item
      ));
      
      // Persist metadata + we can't persist large blobs easily in IDB in all browsers efficiently, 
      // but for ClipboardPro we will save the item state.
      clipboardService.saveItem({ ...metaItem, status: 'completed', progress: 100, fileMeta: { ...metadata, id: metaId } });
    }
  }, [connection, isConnected, peerId]);

  const clearHistory = useCallback(() => {
    clipboardService.clearAll().then(() => setItems([]));
  }, []);

  const deleteItem = useCallback((id: string) => {
    clipboardService.deleteItem(id).then(() => {
      setItems(prev => prev.filter(item => item.id !== id));
    });
  }, []);

  return (
    <ConnectionContext.Provider value={{ 
      peerId, 
      isConnected, 
      connection, 
      items, 
      connectToPeer, 
      sendText, 
      sendFiles,
      clearHistory,
      deleteItem
    }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};
