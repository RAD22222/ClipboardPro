
import React, { useState, useRef } from 'react';
import { useConnection } from '../context/ConnectionContext';
import { Send, Plus, FileText, Image as ImageIcon, Video, Music, File, Download, X, Copy, Check, UploadCloud } from 'lucide-react';
import FileCard from './FileCard';

const ClipboardPage: React.FC = () => {
  const { items, sendText, sendFiles } = useConnection();
  const [inputText, setInputText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendText = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim()) {
      sendText(inputText.trim());
      setInputText('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      sendFiles(e.target.files);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      sendFiles(e.dataTransfer.files);
    }
  };

  return (
    <div 
      className="h-full flex flex-col gap-6 relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-600/20 backdrop-blur-sm border-4 border-dashed border-indigo-500 rounded-3xl flex flex-col items-center justify-center animate-in fade-in duration-200">
          <UploadCloud size={64} className="text-indigo-400 animate-bounce" />
          <p className="text-2xl font-bold text-white mt-4">Drop files to send</p>
        </div>
      )}

      {/* Input Area */}
      <div className="glass p-4 rounded-2xl shadow-xl border border-white/10 group focus-within:border-indigo-500/50 transition-all">
        <form onSubmit={handleSendText} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste text or type a message..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              className="w-full bg-transparent border-none text-white placeholder-slate-500 resize-none py-2 px-1 focus:outline-none min-h-[44px] max-h-32 scrollbar-hide"
            />
          </div>
          <div className="flex items-end gap-2">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <Plus size={20} />
            </button>
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Send size={20} />
            </button>
          </div>
          <input 
            type="file" 
            multiple 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </form>
      </div>

      {/* History Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-20">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
            <FileText size={48} />
            <p className="text-lg">Your clipboard is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
              item.type === 'TEXT' ? (
                <TextCard key={item.id} item={item} />
              ) : (
                <FileCard key={item.id} item={item} />
              )
            ))}
          </div>
        )}
      </div>

      {/* Floating Upload Button (Mobile) */}
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-8 right-8 sm:hidden w-14 h-14 rounded-full bg-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <Plus size={28} />
      </button>
    </div>
  );
};

const TextCard: React.FC<{ item: any }> = ({ item }) => {
  const { deleteItem } = useConnection();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass group p-5 rounded-2xl border border-white/5 hover:border-white/20 transition-all flex gap-4 animate-in slide-in-from-bottom-2">
      <div className={`p-3 h-fit rounded-xl ${item.isIncoming ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
        <FileText size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {item.isIncoming ? 'Received' : 'Sent'} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={copyToClipboard}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
            <button 
              onClick={() => deleteItem(item.id)}
              className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <p className="text-slate-200 text-sm whitespace-pre-wrap break-words leading-relaxed">
          {item.content}
        </p>
      </div>
    </div>
  );
};

export default ClipboardPage;
