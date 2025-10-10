import React, { useState, useEffect } from 'react';
import { getSaintsOfTheDay } from '../services/geminiService';
import type { SaintOfTheDay } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { translations } from '../lib/translations';
import type { Language } from '../App';

interface SaintsOfTheDayProps {
  onSelectSaint: (name: string) => void;
  language: Language;
}

const SaintsOfTheDay: React.FC<SaintsOfTheDayProps> = ({ onSelectSaint, language }) => {
  const [saints, setSaints] = useState<SaintOfTheDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];

  useEffect(() => {
    const fetchSaints = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const saintsData = await getSaintsOfTheDay(language);
        setSaints(saintsData);
      } catch (err) {
        setError(t.errorSaintsOfTheDay);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSaints();
  }, [language, t.errorSaintsOfTheDay]);

  if (isLoading) {
    return (
      <div className="mt-12">
        <LoadingSpinner message={t.loadingSaintsOfTheDay} />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 mt-12">{error}</p>;
  }

  if (saints.length === 0) {
    return <p className="text-center text-stone-500 mt-12">{t.noSaintsToday}</p>;
  }

  return (
    <div className="mt-12 animate-fade-in">
      <h3 className="text-2xl font-bold text-center text-stone-700 mb-6">{t.saintsOfTheDay}</h3>
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
        {saints.map((saint) => (
          <button
            key={saint.name}
            onClick={() => onSelectSaint(saint.name)}
            className="text-left p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-stone-200"
          >
            <h4 className="text-xl font-bold text-amber-800">{saint.name}</h4>
            <p className="mt-2 text-stone-600">{saint.summary}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SaintsOfTheDay;