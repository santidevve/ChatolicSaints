import React, { useState, useEffect } from 'react';
import { askAboutScripture } from '../services/geminiService';
import { translations } from '../lib/translations';
import type { Language } from '../App';
import LoadingSpinner from './LoadingSpinner';

interface AskGeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextText: string;
  language: Language;
}

const AskGeminiModal: React.FC<AskGeminiModalProps> = ({ isOpen, onClose, contextText, language }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const t = translations[language];

  // Reset state when modal is reopened
  useEffect(() => {
    if (isOpen) {
      setQuestion('');
      setAnswer('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError('');
    setAnswer('');
    try {
      const result = await askAboutScripture(contextText, question, language);
      setAnswer(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-stone-200">
          <h2 className="text-2xl font-bold text-amber-800">{t.askAboutScripture}</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-800 transition text-2xl">&times;</button>
        </header>
        
        <div className="p-6 overflow-y-auto">
          <div className="mb-4">
            <p className="font-semibold text-stone-600 mb-2">Context:</p>
            <blockquote className="bg-stone-100 p-3 rounded-md border-l-4 border-amber-500 text-stone-700 italic">
              "{contextText}"
            </blockquote>
          </div>
          
          <form onSubmit={handleSubmit} className="mb-4">
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={t.yourQuestion}
              rows={3}
              className="w-full p-2 text-lg text-stone-800 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition duration-300 mb-2"
            />
            <button 
              type="submit" 
              disabled={isLoading || !question.trim()}
              className="w-full px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition disabled:bg-stone-400"
            >
              {isLoading ? t.gettingAnswer : t.submit}
            </button>
          </form>

          {isLoading && <LoadingSpinner message={t.gettingAnswer} />}
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
          {answer && (
            <div className="prose max-w-none text-stone-700 leading-relaxed whitespace-pre-wrap animate-fade-in">
              <h3 className="text-xl font-bold text-amber-800 border-b border-amber-100 pb-1">Gemini's Answer:</h3>
              <p>{answer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AskGeminiModal;
