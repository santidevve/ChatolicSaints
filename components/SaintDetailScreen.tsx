
import React, { useState, useEffect, useCallback } from 'react';
import { getSaintInfo, generateSaintImage } from '../services/geminiService';
import type { SaintInfo } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { translations } from '../lib/translations';
import type { Language } from '../App';
import ShareButton from './ShareButton';

interface SaintDetailScreenProps {
  saintName: string;
  onGoBack: () => void;
  language: Language;
}

const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden mb-8 ${className}`}>
        <div className="p-6">
          <h2 className="text-3xl font-bold text-amber-800 mb-4 border-b-2 border-amber-100 pb-2">{title}</h2>
          {children}
        </div>
    </div>
);

const SaintDetailScreen: React.FC<SaintDetailScreenProps> = ({ saintName, onGoBack, language }) => {
  const [saintInfo, setSaintInfo] = useState<SaintInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];

  const fetchSaintData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [infoData, imageDataUrl] = await Promise.all([
        getSaintInfo(saintName, language),
        generateSaintImage(saintName, language)
      ]);

      setSaintInfo({ ...infoData, imageUrl: imageDataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [saintName, language]);

  useEffect(() => {
    fetchSaintData();
  }, [fetchSaintData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <LoadingSpinner message={t.loadingSaint(saintName)} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl text-red-600 mb-4">{t.errorTitle}</h2>
        <p className="text-stone-700 mb-6">{error}</p>
        <button onClick={onGoBack} className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
          {t.backToSearch}
        </button>
      </div>
    );
  }

  if (!saintInfo) {
    return null;
  }

  return (
    <div>
      <button onClick={onGoBack} className="inline-flex items-center mb-6 px-4 py-2 bg-white/80 backdrop-blur-sm text-stone-800 rounded-lg shadow-md hover:bg-white transition-all duration-300 group z-20 relative">
        <BackArrowIcon />
        {t.backToSearch}
      </button>
      
      <div className="animate-fade-in">
        <header className="relative rounded-xl shadow-2xl overflow-hidden mb-12 h-80 md:h-96 flex items-center justify-center text-center text-white">
          {saintInfo.imageUrl ? (
            <img src={saintInfo.imageUrl} alt={`Artistic depiction of ${saintInfo.name}`} className="absolute top-0 left-0 w-full h-full object-cover object-center animate-fade-in" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
          
          <div className="absolute top-4 right-4 z-20">
              <ShareButton
                  shareData={{
                      title: saintInfo.name,
                      text: `${saintInfo.name}: ${saintInfo.summary}`,
                      url: window.location.href,
                  }}
                  ariaLabel={t.shareSaint(saintInfo.name)}
                  className="bg-white/20 hover:bg-white/40 text-white"
              />
          </div>

          <div className="relative z-10 p-6 animate-slide-up mt-auto w-full pb-10">
              <h1 className="text-5xl md:text-7xl font-bold drop-shadow-lg">{saintInfo.name}</h1>
              <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto drop-shadow-md">
                {saintInfo.summary}
              </p>
          </div>
        </header>
        
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
              <Card title={t.biography}>
                <div className="prose max-w-none text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {saintInfo.biography}
                </div>
              </Card>
          </div>
          
          <div className="md:col-span-2">
            <div className="sticky top-24">
              <Card title={t.keyFacts}>
                <ul className="space-y-3 text-stone-700">
                  <li><strong>{t.feastDay}:</strong> {saintInfo.feastDay}</li>
                  <li>
                    <strong>{t.patronage}:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      {saintInfo.patronage.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </li>
                </ul>
              </Card>
              
              <Card title={t.quotes}>
                  <blockquote className="space-y-4">
                      {saintInfo.quotes.map((quote, i) => (
                          <p key={i} className="text-stone-600 italic border-l-4 border-amber-500 pl-4">"{quote}"</p>
                      ))}
                  </blockquote>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaintDetailScreen;