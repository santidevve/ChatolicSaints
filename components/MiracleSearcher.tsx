import React, { useState, useCallback } from 'react';
import { getEucharisticMiracleInfo } from '../services/geminiService';
import type { EucharisticMiracle } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { translations } from '../lib/translations';
import type { Language } from '../App';

interface MiracleSearcherProps {
  language: Language;
}

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const MiracleSearcher: React.FC<MiracleSearcherProps> = ({ language }) => {
    const [query, setQuery] = useState('');
    const [miracleInfo, setMiracleInfo] = useState<EucharisticMiracle | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const t = translations[language];

    const performSearch = useCallback(async (searchTerm: string) => {
        if (!searchTerm.trim()) return;

        setQuery(searchTerm);
        setIsLoading(true);
        setError(null);
        setMiracleInfo(null);
        try {
            const result = await getEucharisticMiracleInfo(searchTerm.trim(), language);
            setMiracleInfo(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : t.noMiracleInfo);
        } finally {
            setIsLoading(false);
        }
    }, [language, t.noMiracleInfo]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(query);
    };
    
    const featuredMiracles = t.featuredMiracles;

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-amber-800">{t.miracleSearcherTitle}</h1>
                <p className="mt-2 text-lg text-stone-600 max-w-2xl mx-auto">{t.miracleSearcherSubtitle}</p>
            </div>

            <form onSubmit={handleFormSubmit} className="w-full max-w-xl mx-auto mb-8">
              <div className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.miracleSearchPlaceholder}
                  className="w-full pl-6 pr-20 py-4 text-lg text-stone-800 bg-white/90 backdrop-blur-sm border-2 border-stone-300 rounded-full shadow-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition duration-300"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-20 h-full text-white bg-amber-600 rounded-r-full hover:bg-amber-700 transition-colors duration-300 shadow-md group-hover:shadow-lg disabled:bg-stone-400"
                  aria-label={t.search}
                >
                  {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SearchIcon />}
                </button>
              </div>
            </form>

            {isLoading && <LoadingSpinner message={t.researchingMiracle} />}
            {error && <p className="text-center text-red-600 bg-red-100 p-4 rounded-lg">{error}</p>}
            
            {!isLoading && !error && !miracleInfo && (
                 <div className="mt-8">
                    <h3 className="text-xl font-semibold text-stone-600 mb-4 text-center">{t.featuredMiraclesTitle}</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {featuredMiracles.map(miracle => (
                            <button 
                                key={miracle.name} 
                                onClick={() => performSearch(miracle.name)}
                                className="px-4 py-2 bg-stone-200 text-stone-700 rounded-full hover:bg-amber-200 hover:shadow-md transition transform hover:-translate-y-1"
                            >
                                {miracle.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {miracleInfo && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-8 animate-fade-in">
                    <div className="p-6 md:p-8">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-amber-800 mb-4 border-b-2 border-amber-100 pb-2">{t.miracleSummary}</h2>
                            <div className="prose max-w-none text-stone-700 leading-relaxed whitespace-pre-wrap">
                                {miracleInfo.summary}
                            </div>
                        </div>

                        {miracleInfo.sources.length > 0 && (
                            <div>
                                <h2 className="text-3xl font-bold text-amber-800 mb-4 border-b-2 border-amber-100 pb-2">{t.sources}</h2>
                                <ul className="space-y-3 list-disc list-inside">
                                    {miracleInfo.sources.map((source, index) => (
                                        <li key={index} className="text-stone-700">
                                            <a 
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-amber-700 hover:text-amber-900 hover:underline transition"
                                            >
                                                {source.title || source.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiracleSearcher;