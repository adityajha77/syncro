import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar, NavTab } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { RoadmapPage } from './pages/RoadmapPage';
import { ComingSoonPage } from './pages/ComingSoonPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [comingSoonTitle, setComingSoonTitle] = useState('Coming Soon');

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenComingSoon = (title?: string) => {
    setComingSoonTitle(title || 'Coming Soon');
    setCurrentTab('pricing');
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
        <Navbar 
          currentTab={currentTab} 
          setCurrentTab={(tab) => {
            if (tab === 'pricing') {
              setComingSoonTitle('Pricing');
            } else if (tab === 'auth') {
              setComingSoonTitle('Account Portal');
            }
            setCurrentTab(tab);
          }} 
          onNavigateSection={scrollToSection}
        />
        <main className="flex-1">
          {currentTab === 'home' && (
            <HomePage 
              onNavigateToRoadmap={() => setCurrentTab('roadmap')} 
              onNavigateToComingSoon={handleOpenComingSoon}
            />
          )}

          {currentTab === 'roadmap' && (
            <RoadmapPage />
          )}

          {(currentTab === 'pricing' || currentTab === 'auth') && (
            <ComingSoonPage 
              title={comingSoonTitle}
              subtitle={
                currentTab === 'pricing'
                  ? 'Our transparent, team-friendly pricing tiers will be unveiled soon.'
                  : currentTab === 'auth'
                  ? 'Workspace authentication, single sign-on, and user accounts are launching in Phase 2.'
                  : 'Start your journey with Syncro. Early access enrollment is now open.'
              }
              onBack={() => setCurrentTab('home')}
            />
          )}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default App;
