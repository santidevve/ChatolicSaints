import React, { useState, useCallback } from 'react';
import { getScripture, searchBible } from '../services/geminiService';
import type { BibleVerse } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { translations } from '../lib/translations';
import { bibleBooks } from '../lib/bibleData';
import type { Language } from '../App';

type BibleMode = 'read' | 'search';

const BibleReader: React.FC<{ language: Language }> = ({ language }) => {
  const [mode, setMode] = useState<BibleMode>('read');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read state
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [selectedChapter, setSelectedChapter] = useState('1');
  const [chapterText, setChapterText] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  
  const t = translations[language];
  const books = t.bibleBooks;

  const handleFetchChapter = useCallback(async () => {
    if (!selectedBook || !selectedChapter) return;
    setIsLoading(true);
    setError(null);
    setChapterText('');
    try {
      const text = await getScripture(selectedBook, selectedChapter, language);
      setChapterText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBook, selectedChapter, language]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const results = await searchBible(searchQuery, language);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentBookChapters = bibleBooks[selectedBook] || 1;
  const chapterOptions = Array.from({ length: currentBookChapters }, (_, i) => i + 1);

  return (
    <div className="animate-fade-in">
      <h1 className="text-4xl md:text-5xl font-bold text-amber-800 mb-6 text-center">{t.bibleReader}</h1>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-center border-b border-stone-200 mb-6">
          <button onClick={() => setMode('read')} className={`px-6 py-2 text-lg font-semibold transition ${mode === 'read' ? 'border-b-2 border-amber-600 text-amber-700' : 'text-stone-500'}`}>
            {t.read}
          </button>
          <button onClick={() => setMode('search')} className={`px-6 py-2 text-lg font-semibold transition ${mode === 'search' ? 'border-b-2 border-amber-600 text-amber-700' : 'text-stone-500'}`}>
            {t.search}
          </button>
        </div>

        {mode === 'read' ? (
          <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
              <div className="relative w-full sm:flex-grow">
                <select
                  value={selectedBook}
                  onChange={e => {
                    setSelectedBook(e.target.value);
                    setSelectedChapter('1');
                  }}
                  className="w-full p-3 text-lg text-stone-800 bg-white border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition duration-300 appearance-none"
                  aria-label={t.selectBook}
                >
                  {Object.keys(books).map(book => <option key={book} value={book}>{books[book]}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-700">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <div className="relative w-full sm:w-auto">
                  <select
                      value={selectedChapter}
                      onChange={e => setSelectedChapter(e.target.value)}
                      className="w-full sm:w-48 p-3 text-lg text-stone-800 bg-white border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition duration-300 appearance-none"
                      aria-label={t.selectChapter}
                  >
                      {chapterOptions.map(chap => <option key={chap} value={chap}>{t.chapter} {chap}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-700">
                      <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
              </div>
              
              <button onClick={handleFetchChapter} disabled={isLoading} className="w-full sm:w-auto px-8 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition disabled:bg-stone-400 text-lg">
                {isLoading ? t.loading : t.go}
              </button>
            </div>
            {isLoading && <LoadingSpinner message={t.loadingScripture} />}
            {error && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            {chapterText && (
                <div className="mt-6 bg-stone-50 p-4 rounded-lg prose max-w-none whitespace-pre-wrap">
                    <h2 className="text-2xl font-bold text-amber-800">{books[selectedBook]} {selectedChapter}</h2>
                    <p>{chapterText}</p>
                </div>
            )}
          </div>
        ) : (
          <div>
            <form onSubmit={handleSearch} className="flex gap-4 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.bibleSearchPlaceholder}
                className="w-full p-2 text-lg text-stone-800 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition duration-300"
              />
              <button type="submit" disabled={isLoading} className="px-6 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition disabled:bg-stone-400">
                {isLoading ? t.searching : t.search}
              </button>
            </form>
            {isLoading && <LoadingSpinner message={t.searchingScripture} />}
            {error && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            {searchResults.length > 0 && (
                <div className="mt-6 space-y-4">
                    {searchResults.map((verse, index) => (
                        <div key={index} className="bg-stone-50 p-4 rounded-lg border-l-4 border-amber-500">
                            <p className="font-bold text-stone-800">{verse.reference}</p>
                            <p className="text-stone-700 mt-1">"{verse.text}"</p>
                        </div>
                    ))}
                </div>
            )}
             {!isLoading && searchResults.length === 0 && searchQuery && (
                <p className="text-center text-stone-500 mt-6">{t.noResults(searchQuery)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BibleReader;