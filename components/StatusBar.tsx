
import React, { useState } from 'react';
import { useConnection } from '../context/ConnectionContext.tsx';
import { Share2, Link as LinkIcon, Settings, ShieldCheck, Trash2 } from 'lucide-react';
import SettingsModal from './SettingsModal.tsx';

const StatusBar: React.FC = () => {
  const { peerId, isConnected, clearHistory } = useConnection();
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${peerId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareApp = async () => {
    const shareData = {
      title: 'ClipboardPro',
      text: 'Connect to my clipboard to share files instantly!',
      url: `${window.location.origin}${window.location.pathname}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert('URL copied to clipboard! Open it on your other device.');
    }
  };

  return (
    <header className="py-4 flex items-center justify-between border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">ClipboardPro</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={shareApp}
          className="p-2.5 rounded-xl glass hover:bg-white/10 text-slate-200 transition-all hidden sm:flex"
          title="Open on another device"
        >
          <Share2 size={20} />
        </button>

        {isConnected && (
          <button 
            onClick={clearHistory}
            className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
            title="Clear History"
          >
            <Trash2 size={20} />
          </button>
        )}
        
        <button 
          onClick={copyLink}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm glass ${
            copied ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'hover:bg-white/10 text-slate-200'
          }`}
        >
          {copied ? <ShieldCheck size={18} /> : <LinkIcon size={18} />}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Link'}</span>
        </button>

        <button 
          onClick={() => setShowSettings(true)}
          className="p-2.5 rounded-xl glass hover:bg-white/10 text-slate-200 transition-all"
        >
          <Settings size={20} />
        </button>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </header>
  );
};

export default StatusBar;
