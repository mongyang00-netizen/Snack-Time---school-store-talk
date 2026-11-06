import { useState, useRef, useCallback, useEffect } from 'react';
import { DIALOGUE_AUDIO } from '../data/dialogueAudio';

export function useDialogueAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop currently playing audio or fallback TTS
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Fallback to Web Speech API TTS only if MP3 audio fails to load/play
  const fallbackToSpeechSynthesis = useCallback(
    (text: string, rate: number = 0.9, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsPlaying(false);
        onEnd?.();
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = rate;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => {
          setIsPlaying(false);
          onEnd?.();
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          onEnd?.();
        };
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis fallback error:', err);
        setIsPlaying(false);
        onEnd?.();
      }
    },
    []
  );

  const playMp3 = useCallback(
    (src: string, fallbackText: string, rate: number, onEnd?: () => void) => {
      stopAudio();

      try {
        const audio = new Audio(src);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsPlaying(true);
        };

        audio.onended = () => {
          setIsPlaying(false);
          audioRef.current = null;
          onEnd?.();
        };

        audio.onerror = (e) => {
          console.warn(`Audio playback error for ${src}, falling back to TTS:`, e);
          fallbackToSpeechSynthesis(fallbackText, rate, onEnd);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio play() interrupted or rejected:', err);
            // If autoplay was blocked before user interaction, don't break app state
            setIsPlaying(false);
            onEnd?.();
          });
        }
      } catch (err) {
        console.warn('Audio construction error:', err);
        fallbackToSpeechSynthesis(fallbackText, rate, onEnd);
      }
    },
    [stopAudio, fallbackToSpeechSynthesis]
  );

  const playClerk = useCallback(
    (turnId: number, fallbackText: string, onEnd?: () => void) => {
      const paths = DIALOGUE_AUDIO[turnId];
      if (paths?.clerk) {
        playMp3(paths.clerk, fallbackText, 0.9, onEnd);
      } else {
        fallbackToSpeechSynthesis(fallbackText, 0.9, onEnd);
      }
    },
    [playMp3, fallbackToSpeechSynthesis]
  );

  const playTargetNormal = useCallback(
    (turnId: number, fallbackText: string, onEnd?: () => void) => {
      const paths = DIALOGUE_AUDIO[turnId];
      if (paths?.targetNormal) {
        playMp3(paths.targetNormal, fallbackText, 0.9, onEnd);
      } else {
        fallbackToSpeechSynthesis(fallbackText, 0.9, onEnd);
      }
    },
    [playMp3, fallbackToSpeechSynthesis]
  );

  const playTargetSlow = useCallback(
    (turnId: number, fallbackText: string, onEnd?: () => void) => {
      const paths = DIALOGUE_AUDIO[turnId];
      if (paths?.targetSlow) {
        playMp3(paths.targetSlow, fallbackText, 0.7, onEnd);
      } else {
        fallbackToSpeechSynthesis(fallbackText, 0.7, onEnd);
      }
    },
    [playMp3, fallbackToSpeechSynthesis]
  );

  return {
    isPlaying,
    stopAudio,
    playClerk,
    playTargetNormal,
    playTargetSlow,
  };
}
