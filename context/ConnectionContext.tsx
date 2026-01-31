
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { ClipboardItem, DataMessage, MessageType, FileMetadata, FileChunk } from '../types';
import { splitFileIntoChunks, assembleChunks } from '../utils/chunkHelpers';
import { clipboardService } from '../services/ClipboardService';

const PEER_ID_KEY = 'clipboard_pro_peer_id';
const PIN_PREFIX = 'cbp-pin-';

interface ConnectionContextProps {
  peerId: string;
  isConnected: boolean;
  isConnecting: boolean;
  isBroadcasting: boolean;
  discoveryPin: string | null;
  items: ClipboardItem[];
  connectToPeer: (targetId: string) => void;
  startBroadcasting: () => void;
  stopBroadcasting: () => void;
  joinByPin: (pin: string) => void;
  sendText: (text: string) => void;
  sendFiles: (files: FileList | File[]) => void;
  clearHistory: () => void;
  deleteItem: (id: string) => void;
  resetConnection: () => void;
}

const ConnectionContext = createContext<ConnectionContextProps | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [peerId, setPeerId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [discoveryPin, setDiscoveryPin] = useState<string | null>(null);
  const [items, setItems] = useState<ClipboardItem[]>([]);
  
  const peerRef = useRef<Peer | null>(null);
  const discoveryPeerRef = useRef<Peer | null>(null);
  const connectionTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const activeChunksRef = useRef<Record<string, { chunks: string[]; meta: FileMetadata }>>({});

  const setupConnection = useCallback((conn: DataConnection) => {
    setIsConnecting(true);

    if (connectionTimeoutRef.current) window.clearTimeout(connectionTimeoutRef.current);
    connectionTimeoutRef.current = window.setTimeout(() => {
      if (!isConnected) {
        setIsConnecting(false);
        conn.close();
      }
    }, 25000);
    
    conn.on('open', () => {
      if (connectionTimeoutRef.current) window.clearTimeout(connectionTimeoutRef.current);
      setIsConnected(true);
      setIsConnecting(false);
      setDiscoveryPin(null);
      setIsBroadcasting(false);
      
      if (discoveryPeerRef.current) {
        discoveryPeerRef.current.destroy();
        discoveryPeerRef.current = null;
      }

      if (pingIntervalRef.current) window.clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = window.setInterval(() => {
        conn.send({ type: MessageType.PING, timestamp: Date.now() });
      }, 5000);
    });

    conn.on('data', (data: any) => {
      if (data?.type === MessageType.PING) return;
      if (data?.type === 'HANDSHAKE') {
        const remotePersistentId = data.payload;
        console.log("Discovery handshake complete with:", remotePersistentId);
        return;
      }
      handleIncomingData(data);
    });

    const cleanup = () => {
      setIsConnected(false);
      setIsConnecting(false);
      if (connectionTimeoutRef.current) window.clearTimeout(connectionTimeoutRef.current);
      if (pingIntervalRef.current) window.clearInterval(pingIntervalRef.current);
    };

    conn.on('close', cleanup);
    conn.on('error', cleanup);
  }, [isConnected]);

  useEffect(() => {
    clipboardService.getAllItems().then(setItems);

    const initPeer = () => {
      const savedId = localStorage.getItem(PEER_ID_KEY);
      const peer = new Peer(savedId || undefined, {
        config: { 'iceServers': [{ url: 'stun:stun.l.google.com:19302' }] },
        debug: 1
      });

      peerRef.current = peer;
      peer.on('open', (id) => {
        setPeerId(id);
        localStorage.setItem(PEER_ID_KEY, id);
      });
      peer.on('connection', (conn) => setupConnection(conn));
      peer.on('disconnected', () => peer.reconnect());
      peer.on('error', (err) => {
        setIsConnecting(false);
        if (err.type === 'id-taken') {
          localStorage.removeItem(PEER_ID_KEY);
          window.location.reload();
        }
      });
    };

    initPeer();
    return () => peerRef.current?.destroy();
  }, [setupConnection]);

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
          setItems(prev => prev.map(item => item.id === chunk.id ? { ...item, progress } : item));
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
    if (!targetId || !peerRef.current?.open) return;
    const conn = peerRef.current.connect(targetId.trim(), { reliable: true });
    setupConnection(conn);
  }, [setupConnection]);

  const startBroadcasting = useCallback(() => {
    if (isBroadcasting) return;
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const pinId = PIN_PREFIX + pin;

    const dPeer = new Peer(pinId, {
      config: { 'iceServers': [{ url: 'stun:stun.l.google.com:19302' }] }
    });

    discoveryPeerRef.current = dPeer;
    dPeer.on('open', () => {
      setDiscoveryPin(pin);
      setIsBroadcasting(true);
    });

    dPeer.on('connection', (conn) => {
      conn.on('open', () => {
        conn.send({ type: 'HANDSHAKE', payload: peerId });
        setupConnection(conn);
      });
    });

    dPeer.on('error', (err) => {
      if (err.type === 'id-taken') {
        dPeer.destroy();
        setIsBroadcasting(false);
        startBroadcasting();
      }
    });
  }, [isBroadcasting, peerId, setupConnection]);

  const stopBroadcasting = useCallback(() => {
    discoveryPeerRef.current?.destroy();
    discoveryPeerRef.current = null;
    setIsBroadcasting(false);
    setDiscoveryPin(null);
  }, []);

  const joinByPin = useCallback((pin: string) => {
    const pinId = PIN_PREFIX + pin.trim();
    connectToPeer(pinId);
  }, [connectToPeer]);

  const resetConnection = useCallback(() => {
    setIsConnecting(false);
    setIsConnected(false);
    stopBroadcasting();
    if (connectionTimeoutRef.current) window.clearTimeout(connectionTimeoutRef.current);
  }, [stopBroadcasting]);

  const sendText = useCallback((text: string) => {
    const conn = peerRef.current?.connections[Object.keys(peerRef.current?.connections)[0]]?.[0];
    if (conn && isConnected) {
      conn.send({ type: MessageType.TEXT, payload: text, senderId: peerId, timestamp: Date.now() });
      const newItem: ClipboardItem = { id: crypto.randomUUID(), type: 'TEXT', content: text, status: 'completed', timestamp: Date.now(), isIncoming: false };
      setItems(prev => [newItem, ...prev]);
      clipboardService.saveItem(newItem);
    }
  }, [isConnected, peerId]);

  const clearHistory = useCallback(() => {
    setItems([]);
    clipboardService.clearAll();
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    clipboardService.deleteItem(id);
  }, []);

  const sendFiles = useCallback(async (files: FileList | File[]) => {
    const conn = peerRef.current?.connections[Object.keys(peerRef.current?.connections)[0]]?.[0];
    if (!conn || !isConnected) return;
    for (const file of Array.from(files)) {
      const metaId = crypto.randomUUID();
      const metaItem: ClipboardItem = { id: metaId, type: 'FILE', fileMeta: { id: metaId, name: file.name, size: file.size, mimeType: file.type || 'application/octet-stream', chunkCount: 0 }, status: 'pending', progress: 0, timestamp: Date.now(), isIncoming: false, blob: file };
      setItems(prev => [metaItem, ...prev]);
      const metadata = await splitFileIntoChunks(file, (chunk) => {
        conn.send({ type: MessageType.FILE_CHUNK, payload: { ...chunk, id: metaId }, senderId: peerId, timestamp: Date.now() });
      });
      conn.send({ type: MessageType.FILE_META, payload: { ...metadata, id: metaId }, senderId: peerId, timestamp: Date.now() });
      setItems(prev => prev.map(item => item.id === metaId ? { ...item, status: 'completed', progress: 100, fileMeta: { ...metadata, id: metaId } } : item));
      clipboardService.saveItem({ ...metaItem, status: 'completed', progress: 100, fileMeta: { ...metadata, id: metaId } });
    }
  }, [isConnected, peerId]);

  return (
    <ConnectionContext.Provider value={{ 
      peerId, isConnected, isConnecting, isBroadcasting, discoveryPin, items, 
      connectToPeer, startBroadcasting, stopBroadcasting, joinByPin, 
      sendText, sendFiles, clearHistory, deleteItem, resetConnection 
    }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (context === undefined) throw new Error('useConnection must be used within a ConnectionProvider');
  return context;
};
