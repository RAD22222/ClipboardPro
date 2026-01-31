
import React, { useState, useEffect } from 'react';
import { useConnection } from '../context/ConnectionContext';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Scan, Laptop, Smartphone, ArrowRight, Zap, ShieldCheck, Wifi } from 'lucide-react';

const ConnectionPage: React.FC = () => {
  const { peerId, connectToPeer } = useConnection();
  const [targetId, setTargetId] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Check if there is a peer ID in the URL hash
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== peerId) {
      connectToPeer(hash);
    }
  }, [peerId, connectToPeer]);

  const shareUrl = `${window.location.origin}${window.location.pathname}#${peerId}`;

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4 max-w-lg">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Sync across devices instantly.
        </h2>
        <p className="text-slate-400 text-lg">
          No cloud. No accounts. Purely peer-to-peer. Scan the QR code or share the link to connect another device.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Left Side: QR & Local ID */}
        <div className="glass p-8 rounded-3xl flex flex-col items-center space-y-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wifi size={120} />
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-lg transform group-hover:scale-105 transition-transform duration-500">
            {peerId ? (
              <QRCodeSVG value={shareUrl} size={200} bgColor="#ffffff" fgColor="#020617" level="H" />
            ) : (
              <div className="w-[200px] h-[200px] bg-slate-800 animate-pulse rounded-lg" />
            )}
          </div>

          <div className="w-full space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Your Device ID</label>
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-indigo-500/50 transition-colors">
              <code className="flex-1 text-indigo-400 font-mono text-sm truncate">{peerId || 'Initializing...'}</code>
              <button 
                onClick={() => navigator.clipboard.writeText(peerId)}
                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Manual Connect */}
        <div className="glass p-8 rounded-3xl flex flex-col justify-center space-y-8 shadow-2xl relative">
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-indigo-400">
              <Zap size={24} />
              <h3 className="text-xl font-bold">Manual Connection</h3>
            </div>
            
            <p className="text-slate-400 text-sm">
              Enter the Device ID from another instance of ClipboardPro to establish a direct WebRTC connection.
            </p>

            <div className="space-y-4">
              <input 
                type="text"
                placeholder="Paste Peer ID here..."
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
              <button 
                disabled={!targetId}
                onClick={() => connectToPeer(targetId)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                Connect Now
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-around py-4 opacity-50 grayscale hover:grayscale-0 transition-all">
            <Laptop size={32} />
            <div className="h-px w-12 bg-slate-700" />
            <Smartphone size={32} />
          </div>
        </div>
      </div>

      <div className="flex gap-8 text-slate-500 text-xs font-medium uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} />
          No Servers
        </div>
        <div className="flex items-center gap-2">
          <Zap size={16} />
          Low Latency
        </div>
        <div className="flex items-center gap-2 text-indigo-400/80">
          <Scan size={16} />
          Ready to Scan
        </div>
      </div>
    </div>
  );
};

export default ConnectionPage;
