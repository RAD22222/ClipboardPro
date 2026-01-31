
import React from 'react';
import { X, Shield, Storage, Info, Database, Ghost } from 'lucide-react';

const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="glass w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in duration-200">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <Shield className="text-indigo-400" />
            Privacy & Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">General</h3>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <Ghost className="text-slate-400" size={20} />
                <div>
                  <p className="text-sm font-medium">Session Only Mode</p>
                  <p className="text-[11px] text-slate-500">Don't persist history after refresh</p>
                </div>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-indigo-500" />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <Database className="text-slate-400" size={20} />
                <div>
                  <p className="text-sm font-medium">Storage Limit</p>
                  <p className="text-[11px] text-slate-500">Max metadata limit: 100MB</p>
                </div>
              </div>
              <span className="text-xs font-mono text-indigo-400">100MB</span>
            </div>
          </div>

          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
            <div className="flex gap-3 text-indigo-400 mb-2">
              <Info size={18} />
              <h4 className="text-sm font-bold">How it works</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ClipboardPro uses <strong>WebRTC</strong> to create a direct peer-to-peer connection between your devices. No data is ever uploaded to a server. Your clipboard content stays on your devices and is only transferred over your local network or via an encrypted P2P tunnel.
            </p>
          </div>
        </div>

        <div className="p-6 bg-white/5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
