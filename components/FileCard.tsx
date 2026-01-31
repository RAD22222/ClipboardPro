
import React from 'react';
import { useConnection } from '../context/ConnectionContext';
import { File, Download, X, Image as ImageIcon, Video, Music, Loader2, Check } from 'lucide-react';

const FileCard: React.FC<{ item: any }> = ({ item }) => {
  const { deleteItem } = useConnection();
  const meta = item.fileMeta;

  const getIcon = () => {
    if (meta.mimeType.startsWith('image/')) return <ImageIcon size={24} />;
    if (meta.mimeType.startsWith('video/')) return <Video size={24} />;
    if (meta.mimeType.startsWith('audio/')) return <Music size={24} />;
    return <File size={24} />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (item.blob) {
      const url = URL.createObjectURL(item.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = meta.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="glass group p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all flex items-center gap-4 animate-in slide-in-from-bottom-2">
      <div className={`p-4 rounded-xl flex-shrink-0 ${item.isIncoming ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
        {item.status === 'pending' ? <Loader2 size={24} className="animate-spin" /> : getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-sm font-semibold text-slate-100 truncate pr-4">{meta.name}</h4>
          <span className="text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">
            {formatSize(meta.size)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full transition-all duration-300 ${item.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              style={{ width: `${item.progress || 0}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {item.status === 'completed' ? 'DONE' : `${item.progress || 0}%`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {item.status === 'completed' && item.isIncoming && (
          <button 
            onClick={handleDownload}
            className="p-2 hover:bg-emerald-500/10 rounded-xl text-emerald-400 transition-colors"
            title="Download"
          >
            <Download size={18} />
          </button>
        )}
        <button 
          onClick={() => deleteItem(item.id)}
          className="p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default FileCard;
