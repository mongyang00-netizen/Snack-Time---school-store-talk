import { useState, useEffect, useCallback, useRef } from 'react';

const SELECTED_VOICE_STORAGE_KEY = 'school_store_alex_voice_uri';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURIState] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(SELECTED_VOICE_STORAGE_KEY) || '';
    }
    return '';
  });

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Helper to find natural and friendly American English (en-US) female voice for store clerk Alex
  const findAlexFemaleVoice = useCallback((availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    const enUsVoices = availableVoices.filter((v) => v.lang === 'en-US' || v.lang === 'en_US');
    const enVoices = availableVoices.filter((v) => v.lang.startsWith('en'));

    const searchPool = enUsVoices.length ? enUsVoices : enVoices;
    if (!searchPool.length) return availableVoices[0];

    const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = typeof navigator !== 'undefined' && /chrome|chromium|crios/i.test(navigator.userAgent) && !/edge|edg/i.test(navigator.userAgent);

    if (isSafari) {
      // Safari / macOS / iOS natural en-US female voices
      const safariKeys = ['samantha', 'victoria', 'allison', 'ava', 'susan', 'karen', 'zoe', 'female'];
      for (const kw of safariKeys) {
        const match = searchPool.find((v) => v.name.toLowerCase().includes(kw));
        if (match) return match;
      }
    } else if (isChrome) {
      // Chrome natural en-US female voices
      const chromeKeys = ['google us english', 'zira', 'jenny', 'aria', 'samantha', 'female'];
      for (const kw of chromeKeys) {
        const match = searchPool.find((v) => v.name.toLowerCase().includes(kw));
        if (match) return match;
      }
    }

    const femaleKeywords = [
      'samantha',
      'zira',
      'jenny',
      'aria',
      'victoria',
      'allison',
      'ava',
      'susan',
      'karen',
      'zoe',
      'female',
    ];

    for (const kw of femaleKeywords) {
      const match = searchPool.find((v) => v.name.toLowerCase().includes(kw));
      if (match) return match;
    }

    return searchPool.find((v) => v.lang === 'en-US') || searchPool[0];
  }, []);

  const getActiveVoice = useCallback((): SpeechSynthesisVoice | null => {
    const currentVoices = voicesRef.current;
    if (!currentVoices.length) return null;

    if (selectedVoiceURI) {
      const found = currentVoices.find((v) => v.voiceURI === selectedVoiceURI || v.name === selectedVoiceURI);
      if (found) return found;
    }
    return findAlexFemaleVoice(currentVoices) || null;
  }, [selectedVoiceURI, findAlexFemaleVoice]);

  const setSelectedVoiceURI = useCallback((uri: string) => {
    setSelectedVoiceURIState(uri);
    if (typeof window !== 'undefined' && window.localStorage) {
      if (uri) {
        localStorage.setItem(SELECTED_VOICE_STORAGE_KEY, uri);
      } else {
        localStorage.removeItem(SELECTED_VOICE_STORAGE_KEY);
      }
    }
  }, []);

  const resetVoiceToDefault = useCallback(() => {
    setSelectedVoiceURI('');
  }, [setSelectedVoiceURI]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
        voicesRef.current = available;
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    const timer = setInterval(loadVoices, 200);
    setTimeout(() => clearInterval(timer), 3000);

    return () => {
      clearInterval(timer);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string, rate: number = 0.9, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        onEnd?.();
        return;
      }

      let currentVoices = voicesRef.current;
      if (!currentVoices.length) {
        currentVoices = window.speechSynthesis.getVoices();
        if (currentVoices.length) {
          voicesRef.current = currentVoices;
          setVoices(currentVoices);
        }
      }

      window.speechSynthesis.cancel();

      const isIOS = typeof navigator !== 'undefined' && (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      );

      // Per user request: For iOS environment specifically, try slow rate (< 0.85) at 0.6.
      let adjustedRate = rate;
      if (isIOS && rate < 0.85) {
        adjustedRate = 0.6;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = adjustedRate;
      utterance.pitch = 1.0; // Standard natural pitch without artificial shift per requirements

      const femaleVoice = getActiveVoice();
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsSpeaking(false);
        onEnd?.();
      };

      utteranceRef.current = utterance;

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    },
    [getActiveVoice]
  );

  const previewVoice = useCallback((voice: SpeechSynthesisVoice, text?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const sampleText = text || "Hi! I'm Alex. What would you like?";
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.voice = voice;
    utterance.lang = voice.lang || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    voices,
    activeVoice: getActiveVoice(),
    selectedVoiceURI,
    setSelectedVoiceURI,
    resetVoiceToDefault,
    previewVoice,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
}
