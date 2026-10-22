import React from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <HomePage />
      </main>
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        Syncro Connected Workspace • Architecture Initialized & Ready for Development
      </footer>
    </div>
  );
};

export default App;
