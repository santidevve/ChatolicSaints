
import React, { useState, useEffect, useRef } from 'react';
import useVoiceRecognition from '../hooks/useVoiceRecognition';
import { translations } from '../lib/translations';
import type { Language } from '../App';
import { getSaintSuggestions } from '../services/geminiService';

interface SearchScreenProps {
  onSelectSaint: (name: string) => void;
  language: Language;
}

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const MicrophoneIcon = ({ isListening }: { isListening: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-stone-500 group-hover:text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 11-14 0m7 10v4m0 0H8m4 0h4m-4-8a3 3 0 013 3v1a3 3 0 01-6 0v-1a3 3 0 013-3z" />
    </svg>
);

const SearchScreen: React.FC<SearchScreenProps> = ({ onSelectSaint, language }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const { isListening, transcript, startListening, error: voiceError, permissionStatus } = useVoiceRecognition({ language });
  const t = translations[language];
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
    }
  }, [transcript]);
  
  // Debounced effect for fetching suggestions
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      const fetchSuggestions = async () => {
        setIsSuggestionsLoading(true);
        const result = await getSaintSuggestions(query, language);
        // Only update if the query hasn't changed since the request was made
        setSuggestions(result);
        setIsSuggestionsLoading(false);
      };
      fetchSuggestions();
    }, 300); // 300ms delay

    return () => clearTimeout(debounceTimer);
  }, [query, language]);
  
  // Effect for closing suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSuggestions([]);
      onSelectSaint(query.trim());
    }
  };

  const handleSuggestionClick = (name: string) => {
    setQuery(name);
    setSuggestions([]);
    onSelectSaint(name);
  };

  const featuredSaints = [
    'Francis of Assisi',
    'Thérèse of Lisieux',
    'Augustine of Hippo',
    'Joan of Arc',
    'Thomas Aquinas',
    'Maximilian Kolbe'
  ];
  
  const isMicDisabled = isListening || permissionStatus === 'denied';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-4">
      <div className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10" style={{backgroundImage: "url('https://picsum.photos/seed/church/1200/800')"}}></div>
      <div className="relative z-10 animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-bold text-amber-800 drop-shadow-lg">{t.title}</h1>
        <p className="mt-4 mb-8 text-lg md:text-xl text-stone-700 max-w-2xl mx-auto">
          {t.subtitle}
        </p>
        
        <div ref={searchContainerRef} className="relative w-full max-w-lg mx-auto">
          <form onSubmit={handleSearch}>
            <div className="relative group">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isListening ? t.listening : t.searchPlaceholder}
                className="w-full pl-6 pr-32 py-4 text-lg text-stone-800 bg-white/90 backdrop-blur-sm border-2 border-stone-300 rounded-full shadow-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition duration-300"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => startListening()}
                disabled={isMicDisabled}
                className="absolute inset-y-0 right-[68px] flex items-center justify-center w-14 h-full text-stone-500 transition disabled:cursor-not-allowed disabled:opacity-50 group"
                aria-label={t.voiceSearch}
                title={permissionStatus === 'denied' ? t.micPermissionDenied : t.voiceSearch}
              >
                <MicrophoneIcon isListening={isListening} />
              </button>
              <button
                type="submit"
                className="absolute inset-y-0 right-0 flex items-center justify-center w-16 h-full text-white bg-amber-600 rounded-r-full hover:bg-amber-700 transition-colors duration-300 shadow-md group-hover:shadow-lg"
                aria-label={t.search}
              >
                <SearchIcon />
              </button>
            </div>
          </form>

          {(isSuggestionsLoading || suggestions.length > 0) && (
            <ul className="absolute z-20 w-full mt-2 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden text-left">
              {isSuggestionsLoading && <li className="px-5 py-3 text-stone-500">{t.loadingSuggestions}</li>}
              {!isSuggestionsLoading && suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-5 py-3 cursor-pointer hover:bg-amber-100 transition duration-150"
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}

          {voiceError && <p className="text-red-500 text-sm mt-2">{voiceError}</p>}
        </div>

        <div className="mt-12">
            <h3 className="text-xl font-semibold text-stone-600 mb-4">{t.featuredSaints}</h3>
            <div className="flex flex-wrap justify-center gap-3">
                {featuredSaints.map(saint => (
                    <button 
                        key={saint} 
                        onClick={() => onSelectSaint(saint)}
                        className="px-4 py-2 bg-stone-200 text-stone-700 rounded-full hover:bg-amber-200 hover:shadow-md transition transform hover:-translate-y-1"
                    >
                        {saint}
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SearchScreen;
