
import React from 'react';
import { ConnectionProvider, useConnection } from './context/ConnectionContext';
import ConnectionPage from './components/ConnectionPage';
import ClipboardPage from './components/ClipboardPage';
import StatusBar from './components/StatusBar';

const AppContent: React.FC = () => {
  const { isConnected } = useConnection();

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
