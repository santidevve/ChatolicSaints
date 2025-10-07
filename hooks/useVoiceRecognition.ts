
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Language } from '../App';

// TypeScript interfaces for the Web Speech API, which may not be globally typed.
declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  results: {
    0: {
      0: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface VoiceRecognitionOptions {
  language: Language;
}

const useVoiceRecognition = ({ language }: VoiceRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.lang = language === 'es' ? 'es-ES' : 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      let friendlyError = `Speech recognition error: ${event.error}`;
      if (event.error === 'not-allowed') {
        friendlyError = "Microphone access denied. Please allow microphone permission in your browser settings to use this feature.";
      } else if (event.error === 'no-speech') {
        friendlyError = "No speech was detected. Please try again.";
      } else if (event.error === 'language-not-supported') {
        friendlyError = `The selected language (${language}) is not supported for speech recognition.`;
      }
      setError(friendlyError);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Cleanup: stop recognition if the component unmounts.
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.onstart = null;
            recognitionRef.current.onresult = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.stop();
        }
    }
  }, [language]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript(''); // Clear previous transcript before starting
      // Update lang just in case it changed
      recognitionRef.current.lang = language === 'es' ? 'es-ES' : 'en-US';
      recognitionRef.current.start();
    }
  }, [isListening, language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return { isListening, transcript, error, startListening, stopListening };
};

export default useVoiceRecognition;
