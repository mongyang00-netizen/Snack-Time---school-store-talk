import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Helper to find the best male voice for store clerk Alex
  const findAlexMaleVoice = (availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    const enVoices = availableVoices.filter((v) => v.lang.startsWith('en'));
    if (!enVoices.length) return availableVoices[0];

    const maleKeywords = [
      'alex',     // macOS / iOS built-in English voice (named Alex!)
      'david',    // Windows built-in (Microsoft David)
      'guy',      // Windows Natural (Microsoft Guy)
      'mark',     // Windows (Microsoft Mark)
      'daniel',   // macOS / iOS UK male
      'fred',     // macOS
      'george',   // UK male
      'male',     // Any voice explicitly labelled Male
      'tom',
      'aaron',
      'oliver',
    ];

    // 1. Search for an English male voice matching male keywords
    for (const kw of maleKeywords) {
      const match = enVoices.find((v) => v.name.toLowerCase().includes(kw));
      if (match) return match;
    }

    // 2. Fallback to en-US voice
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

    return () => {
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

  // Stable speak function that doesn't recreate when voices load
  const speak = useCallback(
    (text: string, rate: number = 0.9, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        onEnd?.();
        return;
      }

      // If voices are not yet loaded by Chrome on initial mount, retry quickly
      let currentVoices = voicesRef.current;
      if (!currentVoices.length) {
        currentVoices = window.speechSynthesis.getVoices();
        voicesRef.current = currentVoices;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate; // 0.9 for normal, 0.7 for slow
      // Set lower natural pitch for store clerk Alex (male voice)
      utterance.pitch = 0.9;

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

      // Chrome speech synthesis resume safeguard
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    },
    [] // Stable reference! Voices are read via voicesRef.current or getVoices()
  );

  return {
    isSpeaking,
    speak,
    stop,
    voices,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
}
