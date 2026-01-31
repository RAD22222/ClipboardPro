
import React from 'react';
import { ConnectionProvider, useConnection } from './context/ConnectionContext.tsx';
import ConnectionPage from './components/ConnectionPage.tsx';
import ClipboardPage from './components/ClipboardPage.tsx';
import StatusBar from './components/StatusBar.tsx';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isConnected, peerId } = useConnection();

  if (!peerId) {
    return (
      <div className="flex flex-col h-screen items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-slate-400 font-medium">Initializing Secure P2P...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto px-4 sm:px-6">
      <StatusBar />
      <main className="flex-1 overflow-hidden py-4">
        {isConnected ? <ClipboardPage /> : <ConnectionPage />}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ConnectionProvider>
      <AppContent />
    </ConnectionProvider>
  );
};

export default App;
