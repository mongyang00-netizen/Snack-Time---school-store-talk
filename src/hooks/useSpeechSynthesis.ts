import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Helper to find the best male voice for store clerk Alex with browser consistency
  const findAlexMaleVoice = (availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    const enVoices = availableVoices.filter((v) => v.lang.startsWith('en'));
    if (!enVoices.length) return availableVoices[0];

    const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = typeof navigator !== 'undefined' && /chrome|chromium|crios/i.test(navigator.userAgent) && !/edge|edg/i.test(navigator.userAgent);

    if (isSafari) {
      // Safari / macOS / iOS: Daniel, Alex, Oliver, or en-US/en-GB male voices
      const safariKeys = ['daniel', 'alex', 'oliver', 'fred', 'george', 'aaron', 'male'];
      for (const kw of safariKeys) {
        const match = enVoices.find((v) => v.name.toLowerCase().includes(kw));
        if (match) return match;
      }
    } else if (isChrome) {
      // Chrome: Google UK English Male, Microsoft Guy, Microsoft David, or male
      const chromeKeys = ['google uk english male', 'guy', 'david', 'mark', 'alex', 'male', 'tom'];
      for (const kw of chromeKeys) {
        const match = enVoices.find((v) => v.name.toLowerCase().includes(kw));
        if (match) return match;
      }
    }

    const maleKeywords = [
      'alex',
      'david',
      'guy',
      'mark',
      'daniel',
      'fred',
      'george',
      'male',
      'tom',
      'aaron',
      'oliver',
    ];

    for (const kw of maleKeywords) {
      const match = enVoices.find((v) => v.name.toLowerCase().includes(kw));
      if (match) return match;
    }

    return enVoices.find((v) => v.lang === 'en-US') || enVoices[0];
  };

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

    // Periodic check for async voice loading in Chrome/Safari
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

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate; // 0.9 for normal, 0.7 for slow

      const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isChrome = typeof navigator !== 'undefined' && /chrome|chromium|crios/i.test(navigator.userAgent) && !/edge|edg/i.test(navigator.userAgent);

      // Calibrate pitch per browser:
      // Safari voices can sound too deep at low pitch; set 1.05 for warm natural male tone.
      // Chrome default voices can sound neutral/flat; set 1.05 for engaging clerk warmth.
      if (isSafari) {
        utterance.pitch = 1.05;
      } else if (isChrome) {
        utterance.pitch = 1.05;
      } else {
        utterance.pitch = 1.0;
      }

      const maleVoice = findAlexMaleVoice(currentVoices);
      if (maleVoice) {
        utterance.voice = maleVoice;
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
    []
  );

  return {
    isSpeaking,
    speak,
    stop,
    voices,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
}
