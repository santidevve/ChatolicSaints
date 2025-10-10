import React, { useState, useEffect } from 'react';
import { getGospelOfTheDay } from '../services/geminiService';
import type { GospelReading } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { translations } from '../lib/translations';
import type { Language } from '../App';
import ShareButton from './ShareButton';

interface GospelOfTheDayProps {
  language: Language;
}

const GospelOfTheDay: React.FC<GospelOfTheDayProps> = ({ language }) => {
  const [gospel, setGospel] = useState<GospelReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];

  useEffect(() => {
    const fetchGospel = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const gospelData = await getGospelOfTheDay(language);
        setGospel(gospelData);
      } catch (err) {
        setError(t.errorGospel);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGospel();
  }, [language, t.errorGospel]);

  if (isLoading) {
    return (
      <div className="mt-12">
        <LoadingSpinner message={t.loadingGospel} />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 mt-12">{error}</p>;
  }

  if (!gospel) {
    return null; 
  }

  return (
    <div className="mt-12 animate-fade-in">
      <h3 className="text-2xl font-bold text-center text-stone-700 mb-6">{t.gospelOfTheDay}</h3>
      <div className="p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-stone-200">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-2xl font-bold text-amber-800">{gospel.reference}</h4>
            <ShareButton
                shareData={{
                    title: `${t.gospelOfTheDay}: ${gospel.reference}`,
                    text: `Today's Gospel Reading (${gospel.reference}):\n\n${gospel.text}`,
                    url: window.location.href,
                }}
                ariaLabel={t.shareGospel}
            />
        </div>
        <div className="prose max-w-none text-stone-700 leading-relaxed whitespace-pre-wrap text-justify">
          {gospel.text.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GospelOfTheDay;