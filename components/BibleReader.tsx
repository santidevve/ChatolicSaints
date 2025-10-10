
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getScripture, searchBible, generateBibleChapterImage } from '../services/geminiService';
import type { BibleVerse, BookmarkedVerse, ChapterVerse } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { translations } from '../lib/translations';
import { bibleBooks } from '../lib/bibleData';
import type { Language } from '../App';
import BibleContextMenu from './BibleContextMenu';
import AskGeminiModal from './AskGeminiModal';

type BibleMode = 'read' | 'search' | 'bookmarks';

const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.841Z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v10a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5Zm8 0A1.5 1.5 0 0 1 15 5v10a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5Z" /></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5 3.5h10A1.5 1.5 0 0 1 16.5 5v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 15V5A1.5 1.5 0 0 1 5 3.5Z" /></svg>;
const BookmarkOutlineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>;
const BookmarkFilledIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21L12 17.5 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-stone-500 hover:text-red-600 transition-colors"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>;


const BibleReader: React.FC<{ language: Language }> = ({ language }) => {
  const [mode, setMode] = useState<BibleMode>('read');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read state
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [selectedChapter, setSelectedChapter] = useState('1');
  const [verses, setVerses] = useState<ChapterVerse[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  
  // Highlighting and image state
  const [selectedText, setSelectedText] = useState('');
  const [contextMenuPos, setContextMenuPos] = useState<{ top: number, left: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chapterImageUrl, setChapterImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<BookmarkedVerse[]>([]);
  
  const chapterTextRef = useRef<HTMLDivElement>(null);
  const t = translations[language];
  const books = t.bibleBooks;
  
  // --- Bookmarking Logic ---
  useEffect(() => {
    try {
        const savedBookmarks = localStorage.getItem('saints-app-bookmarks');
        if (savedBookmarks) {
            setBookmarks(JSON.parse(savedBookmarks));
        }
    } catch (e) {
        console.error("Failed to load bookmarks from localStorage", e);
    }
  }, []);

  const isBookmarked = (reference: string) => {
    return bookmarks.some(b => b.reference === reference);
  };
  
  const toggleBookmark = (verse: ChapterVerse) => {
    const reference = `${selectedBook} ${selectedChapter}:${verse.verse}`;
    const fullText = `${verse.verse} ${verse.text}`;
    let updatedBookmarks;
    if (isBookmarked(reference)) {
        updatedBookmarks = bookmarks.filter(b => b.reference !== reference);
    } else {
        const newBookmark: BookmarkedVerse = {
            book: selectedBook,
            chapter: selectedChapter,
            reference: reference,
            text: fullText
        };
        updatedBookmarks = [...bookmarks, newBookmark];
    }
    setBookmarks(updatedBookmarks);
    localStorage.setItem('saints-app-bookmarks', JSON.stringify(updatedBookmarks));
  };


  // --- TTS Logic ---
  const handleStopSpeech = useCallback(() => {
    if (typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const startSpeechFromVerse = useCallback((startIndex: number) => {
    if (typeof window.speechSynthesis === 'undefined') {
        setError("Text-to-speech is not supported in this browser.");
        return;
    }
    
    handleStopSpeech();

    const versesToSpeak = verses.slice(startIndex);
    if (versesToSpeak.length === 0) return;

    const textToSpeak = versesToSpeak.map(v => v.text).join(' ');
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  }, [verses, language, handleStopSpeech]);

  useEffect(() => {
    return () => handleStopSpeech();
  }, [handleStopSpeech]);
  
  const handlePlayPauseSpeech = useCallback(() => {
    if (typeof window.speechSynthesis === 'undefined') {
        setError("Text-to-speech is not supported in this browser.");
        return;
    }
    
    if (isSpeaking) {
        if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        } else {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    } else {
        startSpeechFromVerse(0);
    }
  }, [isSpeaking, isPaused, startSpeechFromVerse]);


  // --- Data Fetching Logic ---
  const handleFetchChapter = useCallback(async () => {
    if (!selectedBook || !selectedChapter) return;
    setIsLoading(true);
    setError(null);
    setVerses([]);
    setChapterImageUrl(null);
    setIsImageLoading(true);
    handleStopSpeech();

    try {
      const verseData = await getScripture(selectedBook, selectedChapter, language);
      setVerses(verseData);

      generateBibleChapterImage(selectedBook, selectedChapter, language).then(imageUrl => {
          if (imageUrl) setChapterImageUrl(imageUrl);
      }).finally(() => {
          setIsImageLoading(false);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsImageLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBook, selectedChapter, language, handleStopSpeech]);

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
  
  const handleMouseUp = () => {
    if (chapterTextRef.current) {
        const selection = window.getSelection();
        const selectedString = selection?.toString().trim() ?? '';

        if (selectedString) {
            const range = selection!.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = chapterTextRef.current.getBoundingClientRect();
            
            setSelectedText(selectedString);
            setContextMenuPos({
                top: rect.top - containerRect.top + window.scrollY - 50,
                left: rect.left - containerRect.left + window.scrollX + (rect.width / 2) - 60,
            });
        } else {
            setSelectedText('');
            setContextMenuPos(null);
        }
    }
  };

  useEffect(() => {
    const clearSelection = () => {
        setSelectedText('');
        setContextMenuPos(null);
    };
    document.addEventListener('mousedown', clearSelection);
    return () => document.removeEventListener('mousedown', clearSelection);
  }, []);

  useEffect(() => {
      setSelectedText('');
      setContextMenuPos(null);
  }, [verses]);


  const currentBookChapters = bibleBooks[selectedBook] || 1;
  const chapterOptions = Array.from({ length: currentBookChapters }, (_, i) => i + 1);

  return (
    <div className="animate-fade-in">
      <h1 className="text-4xl md:text-5xl font-bold text-amber-800 mb-6 text-center">{t.bibleReader}</h1>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-center border-b border-stone-200 mb-6">
          <button onClick={() => setMode('read')} className={`px-6 py-2 text-lg font-semibold transition ${mode === 'read' ? 'border-b-2 border-amber-600 text-amber-700' : 'text-stone-500'}`}>{t.read}</button>
          <button onClick={() => setMode('search')} className={`px-6 py-2 text-lg font-semibold transition ${mode === 'search' ? 'border-b-2 border-amber-600 text-amber-700' : 'text-stone-500'}`}>{t.search}</button>
          <button onClick={() => setMode('bookmarks')} className={`px-6 py-2 text-lg font-semibold transition ${mode === 'bookmarks' ? 'border-b-2 border-amber-600 text-amber-700' : 'text-stone-500'}`}>{t.bookmarks}</button>
        </div>

        {mode === 'read' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
              <div className="relative w-full sm:flex-grow">
                <select value={selectedBook} onChange={e => { setSelectedBook(e.target.value); setSelectedChapter('1'); }} className="w-full p-3 text-lg text-stone-800 bg-white border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition duration-300 appearance-none" aria-label={t.selectBook}>
                  {Object.keys(books).map(book => <option key={book} value={book}>{books[book]}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-700"><svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
              </div>

              <div className="relative w-full sm:w-auto">
                  <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} className="w-full sm:w-48 p-3 text-lg text-stone-800 bg-white border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition duration-300 appearance-none" aria-label={t.selectChapter}>
                      {chapterOptions.map(chap => <option key={chap} value={chap}>{t.chapter} {chap}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-700"><svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
              </div>
              
              <button onClick={handleFetchChapter} disabled={isLoading} className="w-full sm:w-auto px-8 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition disabled:bg-stone-400 text-lg">{isLoading ? t.loading : t.go}</button>
            </div>
            {isLoading && <LoadingSpinner message={t.loadingScripture} />}
            {error && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            
            {verses.length > 0 && (
                <div className="mt-6 bg-stone-50 p-6 rounded-lg relative" ref={chapterTextRef} onMouseUp={handleMouseUp} onMouseDown={e => e.stopPropagation()}>
                    {contextMenuPos && selectedText && (<BibleContextMenu top={contextMenuPos.top} left={contextMenuPos.left} onAsk={() => setIsModalOpen(true)} text={t.askGemini}/>)}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-amber-800">{books[selectedBook]} {selectedChapter}</h2>
                        <div className="flex items-center gap-2">
                           <button onClick={handlePlayPauseSpeech} className="p-2 rounded-full hover:bg-amber-100 text-stone-600 transition" aria-label={isSpeaking && !isPaused ? t.audioPause : t.audioPlay}>{isSpeaking && !isPaused ? <PauseIcon/> : <PlayIcon/>}</button>
                           <button onClick={handleStopSpeech} disabled={!isSpeaking} className="p-2 rounded-full hover:bg-amber-100 text-stone-600 transition disabled:opacity-50" aria-label={t.audioStop}><StopIcon/></button>
                        </div>
                    </div>
                    <div className="prose max-w-none text-stone-700 leading-relaxed space-y-2">
                        {verses.map((verse, index) => {
                            const reference = `${selectedBook} ${selectedChapter}:${verse.verse}`;
                            const isVerseBookmarked = isBookmarked(reference);

                            return (
                                <div key={index} className="flex items-start gap-2 py-1">
                                    <button onClick={() => toggleBookmark(verse)} className="text-stone-400 hover:text-amber-600 transition-colors mt-1 flex-shrink-0" aria-label={isVerseBookmarked ? t.removeBookmark : t.addBookmark}>
                                        {isVerseBookmarked ? <BookmarkFilledIcon /> : <BookmarkOutlineIcon />}
                                    </button>
                                    <p
                                        onClick={() => startSpeechFromVerse(index)}
                                        className="cursor-pointer hover:text-amber-800 transition-colors flex-grow"
                                    >
                                        <strong className="text-stone-500 w-6 inline-block mr-1">{verse.verse}</strong>
                                        {verse.text}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {isImageLoading && <div className="mt-8"><LoadingSpinner message={t.imageGenerationLoading} /></div>}
            {chapterImageUrl && !isImageLoading && (
                <div className="mt-8 animate-fade-in">
                    <h3 className="text-3xl font-bold text-amber-800 mb-4 border-b-2 border-amber-100 pb-2">{t.chapterImage}</h3>
                    <img src={chapterImageUrl} alt={t.chapterImage} className="w-full h-auto rounded-lg shadow-lg" />
                </div>
            )}
          </div>
        )}
        
        {mode === 'search' && (
          <div>
            <form onSubmit={handleSearch} className="flex gap-4 mb-4">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t.bibleSearchPlaceholder} className="w-full p-2 text-lg text-stone-800 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition duration-300"/>
              <button type="submit" disabled={isLoading} className="px-6 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition disabled:bg-stone-400">{isLoading ? t.searching : t.search}</button>
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
             {!isLoading && searchResults.length === 0 && searchQuery && (<p className="text-center text-stone-500 mt-6">{t.noResults(searchQuery)}</p>)}
          </div>
        )}

        {mode === 'bookmarks' && (
             <div>
                <h2 className="text-3xl font-bold text-amber-800 mb-4">{t.bookmarks}</h2>
                {bookmarks.length > 0 ? (
                    <div className="space-y-4">
                        {bookmarks.map((bookmark) => (
                            <div key={bookmark.reference} className="bg-stone-50 p-4 rounded-lg border-l-4 border-amber-500">
                                <div className="flex justify-between items-center">
                                    <p className="font-bold text-stone-800">{t.bibleBooks[bookmark.book]} {bookmark.chapter}:{bookmark.reference.split(':')[1]}</p>
                                    <button onClick={() => {
                                        const updatedBookmarks = bookmarks.filter(b => b.reference !== bookmark.reference);
                                        setBookmarks(updatedBookmarks);
                                        localStorage.setItem('saints-app-bookmarks', JSON.stringify(updatedBookmarks));
                                    }} aria-label={t.removeBookmark}><TrashIcon /></button>
                                </div>
                                <p className="text-stone-700 mt-2">"{bookmark.text.replace(/^\d+\s/, '')}"</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-stone-500 mt-8">{t.noBookmarks}</p>
                )}
            </div>
        )}
      </div>

      <AskGeminiModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} contextText={selectedText} language={language}/>
    </div>
  );
};

export default BibleReader;
