import React, { useState, useEffect, useCallback } from 'react';
import { getChantList, getChantLyrics } from '../services/geminiService';
import type { Chant, ChantDetails } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { translations } from '../lib/translations';
import type { Language } from '../App';

const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const ChantBook: React.FC<{ language: Language }> = ({ language }) => {
    const [chantList, setChantList] = useState<Chant[]>([]);
    const [selectedChant, setSelectedChant] = useState<ChantDetails | null>(null);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const t = translations[language];

    useEffect(() => {
        const fetchChantList = async () => {
            try {
                setError(null);
                setIsLoadingList(true);
                const list = await getChantList(language);
                setChantList(list);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoadingList(false);
            }
        };
        fetchChantList();
    }, [language]);

    const handleSelectChant = useCallback(async (chant: Chant) => {
        try {
            setError(null);
            setIsLoadingLyrics(true);
            setSelectedChant(null);
            const lyrics = await getChantLyrics(chant.title, language);
            setSelectedChant({ title: chant.title, lyrics });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoadingLyrics(false);
        }
    }, [language]);

    if (isLoadingList) {
        return <LoadingSpinner message={t.loadingChants} />;
    }

    if (error) {
        return <p className="text-center text-red-600 bg-red-100 p-4 rounded-lg">{error}</p>;
    }

    if (selectedChant) {
        return (
            <div className="animate-fade-in">
                <button onClick={() => setSelectedChant(null)} className="inline-flex items-center mb-6 px-4 py-2 bg-white/80 backdrop-blur-sm text-stone-800 rounded-lg shadow-md hover:bg-white transition-all duration-300 group z-20 relative">
                    <BackArrowIcon />
                    {t.backToChantList}
                </button>
                <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-amber-800 mb-4">{selectedChant.title}</h2>
                    {isLoadingLyrics ? (
                         <LoadingSpinner message={t.loadingLyrics} />
                    ) : (
                        <div className="prose max-w-none text-stone-700 leading-relaxed whitespace-pre-wrap">
                            {selectedChant.lyrics}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-amber-800 mb-2 text-center">{t.chantBookTitle}</h1>
            <p className="text-center text-stone-500 text-sm mb-6">
                {t.chantSourceInfo}
                <a 
                    href="https://neocatechumenaleiter.org/cantoral-resucito/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:underline"
                >
                    {t.chantSourceLinkText}
                </a>
            </p>
            <div className="bg-white rounded-xl shadow-lg">
                <ul className="divide-y divide-stone-200">
                    {chantList.map((chant) => (
                        <li key={chant.number}>
                            <button
                                onClick={() => handleSelectChant(chant)}
                                className="w-full text-left p-4 hover:bg-amber-50 transition flex justify-between items-center"
                            >
                                <div>
                                    <span className="font-bold text-amber-700 w-12 inline-block">{chant.number}</span>
                                    <span className="text-stone-800">{chant.title}</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ChantBook;