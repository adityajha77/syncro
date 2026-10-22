import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { RoadmapPage } from './pages/RoadmapPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'home' | 'roadmap'>('home');

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <main className="flex-1">
          {currentTab === 'home' ? (
            <HomePage onNavigateToRoadmap={() => setCurrentTab('roadmap')} />
          ) : (
            <RoadmapPage />
          )}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default App;
