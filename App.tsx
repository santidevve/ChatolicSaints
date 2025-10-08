
import React, { useState, useCallback } from 'react';
import SearchScreen from './components/SearchScreen';
import SaintDetailScreen from './components/SaintDetailScreen';
import BibleReader from './components/BibleReader';
import MiracleSearcher from './components/MiracleSearcher';
import ChantBook from './components/ChantBook';
import { translations } from './lib/translations';

type View = 'saints' | 'bible' | 'miracles' | 'chants';
export type Language = 'en' | 'es';

const App: React.FC = () => {
  const [selectedSaintName, setSelectedSaintName] = useState<string | null>(null);
  const [view, setView] = useState<View>('saints');
  const [language, setLanguage] = useState<Language>('en');

  const handleSelectSaint = useCallback((name: string) => {
    setSelectedSaintName(name);
  }, []);

  const handleGoBack = useCallback(() => {
    setSelectedSaintName(null);
  }, []);
  
  const t = translations[language];

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 transition-all duration-500">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <nav className="max-w-5xl mx-auto flex justify-between items-center p-4">
          <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('saints')}
                className={`px-4 py-2 rounded-md text-lg font-semibold transition ${view === 'saints' ? 'bg-amber-600 text-white' : 'text-stone-600 hover:bg-amber-100'}`}
              >
                {t.saints}
              </button>
              <button 
                onClick={() => setView('bible')}
                className={`px-4 py-2 rounded-md text-lg font-semibold transition ${view === 'bible' ? 'bg-amber-600 text-white' : 'text-stone-600 hover:bg-amber-100'}`}
              >
                {t.bible}
              </button>
              <button 
                onClick={() => setView('miracles')}
                className={`px-4 py-2 rounded-md text-lg font-semibold transition ${view === 'miracles' ? 'bg-amber-600 text-white' : 'text-stone-600 hover:bg-amber-100'}`}
              >
                {t.miracles}
              </button>
              <button 
                onClick={() => setView('chants')}
                className={`px-4 py-2 rounded-md text-lg font-semibold transition ${view === 'chants' ? 'bg-amber-600 text-white' : 'text-stone-600 hover:bg-amber-100'}`}
              >
                {t.chants}
              </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-sm rounded-full transition ${language === 'en' ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-700'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`px-3 py-1 text-sm rounded-full transition ${language === 'es' ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-700'}`}
            >
              ES
            </button>
          </div>
        </nav>
      </header>
      
      <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        {view === 'saints' && (
            selectedSaintName ? (
              <SaintDetailScreen 
                saintName={selectedSaintName} 
                onGoBack={handleGoBack}
                language={language} 
              />
            ) : (
              <SearchScreen 
                onSelectSaint={handleSelectSaint}
                language={language}
              />
            )
        )}
        {view === 'bible' && <BibleReader language={language} />}
        {view === 'miracles' && <MiracleSearcher language={language} />}
        {view === 'chants' && <ChantBook language={language} />}
      </main>
      <footer className="text-center p-4 text-stone-500 text-sm">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
};

export default App;
