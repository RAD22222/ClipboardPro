
import React, { useState, useEffect, useRef } from 'react';
import { useConnection } from '../context/ConnectionContext.tsx';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Scan, Laptop, Smartphone, ArrowRight, Zap, ShieldCheck, Wifi, Loader2, X, Check, Radio } from 'lucide-react';

const ConnectionPage: React.FC = () => {
  const { 
    peerId, connectToPeer, isConnecting, resetConnection, 
    startBroadcasting, stopBroadcasting, isBroadcasting, discoveryPin, joinByPin 
  } = useConnection();
  
  const [targetId, setTargetId] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [idCopied, setIdCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'id' | 'pin'>('pin');
  
  const hasAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash && peerId && hash !== peerId && hasAttemptedRef.current !== hash) {
      hasAttemptedRef.current = hash;
      connectToPeer(hash);
    }
  }, [peerId, connectToPeer]);

  const shareUrl = `${window.location.origin}${window.location.pathname}#${peerId}`;

  const copyId = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    }
  };

  const handleJoinByPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length === 4) {
      joinByPin(pinInput);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500 relative max-w-4xl mx-auto w-full">
      {/* Connecting Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center space-y-6 border border-white/10 shadow-2xl">
          <div className="relative">
            <Loader2 className="text-indigo-500 animate-spin" size={64} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">Linking Devices...</h3>
            <p className="text-slate-400 text-sm max-w-[240px]">Establishing peer-to-peer data channel.</p>
          </div>
          <button onClick={resetConnection} className="flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-sm border border-white/5">
            <X size={16} /> Cancel
          </button>
        </div>
      )}

      <div className="text-center space-y-4 max-w-lg">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Connect your devices.
        </h2>
        <p className="text-slate-400 text-base">
          Direct sync without cloud storage. Use a Magic PIN for the fastest connection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-10 gap-6 w-full">
        <div className="md:col-span-4 glass p-6 rounded-3xl flex flex-col items-center space-y-6 shadow-xl relative overflow-hidden group">
          <div className="bg-white p-3 rounded-2xl shadow-lg transform group-hover:scale-105 transition-all">
            {peerId ? <QRCodeSVG value={shareUrl} size={160} level="H" /> : <div className="w-[160px] h-[160px] bg-slate-800 animate-pulse rounded-lg" />}
          </div>
          
          <div className="w-full space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Local Identity</label>
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
              <code className="flex-1 text-indigo-400 font-mono text-xs truncate">{peerId || 'Loading...'}</code>
              <button onClick={copyId} className={`p-1.5 rounded-lg transition-all ${idCopied ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
                {idCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[9px] text-center text-slate-500 italic">This ID persists on this device</p>
          </div>
        </div>

        <div className="md:col-span-6 flex flex-col space-y-4">
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
            <button onClick={() => setActiveTab('pin')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'pin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
              <Zap size={16} /> Magic PIN
            </button>
            <button onClick={() => setActiveTab('id')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'id' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
              <ArrowRight size={16} /> Direct ID
            </button>
          </div>

          <div className="glass p-6 rounded-3xl flex-1 flex flex-col shadow-xl min-h-[240px]">
            {activeTab === 'pin' ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Connect via Magic PIN</h3>
                  <p className="text-slate-400 text-xs">Enter a PIN or broadcast your device to nearby peers.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Broadcast</label>
                    {isBroadcasting ? (
                      <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 h-[100px]">
                        <span className="text-3xl font-black text-white tracking-[0.2em]">{discoveryPin}</span>
                        <button onClick={stopBroadcasting} className="text-[10px] text-red-400 font-bold hover:underline flex items-center gap-1">
                          <X size={10} /> STOP
                        </button>
                      </div>
                    ) : (
                      <button onClick={startBroadcasting} className="w-full h-[100px] bg-white/5 border border-white/10 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all text-slate-400">
                        <Radio size={24} className="animate-pulse" />
                        <span className="text-[10px] font-bold">START BROADCAST</span>
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleJoinByPin} className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Join</label>
                    <input type="text" maxLength={4} placeholder="0000" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} className="w-full h-[60px] bg-white/5 border border-white/10 rounded-2xl text-center text-2xl font-black tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    <button type="submit" disabled={pinInput.length !== 4} className="w-full py-2 bg-indigo-600 disabled:opacity-30 rounded-xl text-xs font-bold transition-all active:scale-95">JOIN PIN</button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Join via Device ID</h3>
                  <p className="text-slate-400 text-xs">Directly enter the peer address from another device.</p>
                </div>

                <div className="space-y-4">
                  <input type="text" placeholder="Enter Peer ID..." value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  <button disabled={!targetId || isConnecting} onClick={() => connectToPeer(targetId)} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95">CONNECT DIRECTLY</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-1.5"><ShieldCheck size={14} /> Encrypted P2P</div>
        <div className="flex items-center gap-1.5"><Wifi size={14} /> Network Discovery</div>
        <div className="flex items-center gap-1.5"><Scan size={14} /> QR Link</div>
      </div>
    </div>
  );
};

export default ConnectionPage;
