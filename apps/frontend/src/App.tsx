import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar, NavTab } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { RoadmapPage } from './pages/RoadmapPage';
import { ComingSoonPage } from './pages/ComingSoonPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [comingSoonTitle, setComingSoonTitle] = useState('Coming Soon');

  // Ensure every tab change automatically scrolls to the absolute top of the page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentTab]);

  const scrollToSection = (sectionId: string) => {
    const performScroll = () => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    performScroll();
    setTimeout(performScroll, 50);
    setTimeout(performScroll, 150);
  };

  const handleOpenComingSoon = (title?: string) => {
    setComingSoonTitle(title || 'Start Your Journey');
    setCurrentTab('pricing');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleTabChange = (tab: NavTab) => {
    if (tab === 'pricing') {
      setComingSoonTitle('Pricing Tiers');
    } else if (tab === 'auth') {
      setComingSoonTitle('Account Portal');
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
        <Navbar 
          currentTab={currentTab} 
          setCurrentTab={handleTabChange} 
          onNavigateSection={scrollToSection}
        />
        <main className="flex-1">
          {currentTab === 'home' && (
            <HomePage 
              onNavigateToRoadmap={() => {
                setCurrentTab('roadmap');
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }} 
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
                  ? 'Our transparent, team-friendly pricing tiers will be unveiled soon. Enter your email for early access.'
                  : currentTab === 'auth'
                  ? 'Workspace authentication, single sign-on, and user accounts are launching in Phase 2.'
                  : 'Start your journey with Syncro. Early access enrollment is now open.'
              }
              onBack={() => {
                setCurrentTab('home');
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
            />
          )}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default App;
