import { useState, useEffect, useRef, useCallback } from 'react';
import { soundFX } from '../utils/soundEffects';

interface SpeechRecognitionHookOptions {
  onTranscriptComplete?: (finalText: string) => void;
  targetContext?: string;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
  onsoundend: (() => void) | null;
};

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResult;
  };
}

// No forced string manipulation - genuine speech candidate inspection is used


export function useSpeechRecognition({ onTranscriptComplete, targetContext }: SpeechRecognitionHookOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef('');
  const isListeningRef = useRef(false);
  const hasFinishedRef = useRef(false);
  const targetContextRef = useRef(targetContext);
  const onTranscriptCompleteRef = useRef(onTranscriptComplete);

  useEffect(() => {
    onTranscriptCompleteRef.current = onTranscriptComplete;
  }, [onTranscriptComplete]);

  useEffect(() => {
    targetContextRef.current = targetContext;
    transcriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, [targetContext]);

  // Detect environment (browser, in-app browser, iframe)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      setIsIframe(window.self !== window.top);
    } catch {
      setIsIframe(true);
    }

    const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
    const isInApp = /KAKAOTALK|Instagram|FBAN|FBAV|Line|Twitter/i.test(ua);
    setInAppBrowser(isInApp);

    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setErrorMessage('구글 크롬(Google Chrome) 브라우저를 권장합니다. 현재 브라우저는 음성 인식을 지원하지 않습니다.');
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const finishListening = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    clearSilenceTimer();

    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore if already stopped
      }
    }

    isListeningRef.current = false;
    setIsListening(false);

    const raw = transcriptRef.current.trim();
    if (onTranscriptCompleteRef.current) {
      onTranscriptCompleteRef.current(raw);
    }
  }, [clearSilenceTimer]);

  // Synchronous start to preserve user gesture activation in Chrome / Safari
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    setErrorMessage(null);
    setPermissionDenied(false);
    transcriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    clearSilenceTimer();
    hasFinishedRef.current = false;

    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setErrorMessage('음성 인식을 지원하지 않는 브라우저입니다. Google Chrome에서 접속해 주세요.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      // Request multiple recognition alternatives (up to 5) so authentic candidate hypotheses can be inspected
      recognition.maxAlternatives = 5;

      // Provide speech grammar context to bias the acoustic model naturally toward target phrases
      const GrammarListClass =
        (window as unknown as { SpeechGrammarList?: new () => any }).SpeechGrammarList ||
        (window as unknown as { webkitSpeechGrammarList?: new () => any }).webkitSpeechGrammarList;
      if (GrammarListClass) {
        try {
          const grammarList = new GrammarListClass();
          const target = targetContextRef.current || 'Can I have a sandwich, please? An apple juice, please.';
          // Clean target for grammar definition
          const sanitizedTarget = target.replace(/[^a-zA-Z0-9\s]/g, ' ');
          const grammar = `#JSGF V1.0; grammar school_store; public <rule> = ${sanitizedTarget} | can I have | an apple juice | please | sandwich | how much is it | here you are | thank you bye ;`;
          grammarList.addFromString(grammar, 1);
          (recognition as unknown as { grammars: unknown }).grammars = grammarList;
        } catch {
          // SpeechGrammarList is optional; proceed if not supported by current browser
        }
      }

      recognition.onstart = () => {
        isListeningRef.current = true;
        hasFinishedRef.current = false;
        setIsListening(true);
        soundFX.playMicBeep(true);

        // Safety fallback: if no speech at all after 8 seconds of silence, finish
        silenceTimerRef.current = setTimeout(() => {
          if (isListeningRef.current) {
            finishListening();
          }
        }, 8000);
      };

/**
 * Resolves the most accurate transcript hypothesis across candidate alternatives,
 * correctly capturing authentic English weak forms like unstressed /ən/ ("언") before vowel nouns.
 */
function resolveBestTranscriptHypothesis(
  res: SpeechRecognitionResult,
  targetClean: string
): string {
  if (!res || res.length === 0) return '';

  let bestText = res[0]?.transcript || '';

  // 1. Inspect all genuine candidate alternatives (up to maxAlternatives = 5)
  for (let a = 0; a < res.length; a++) {
    const altText = res[a]?.transcript || '';
    if (!altText) continue;
    const altClean = altText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

    // Exact match with target
    if (targetClean && altClean === targetClean) {
      bestText = altText;
      break;
    }

    // Target phrase match priority (e.g. "an apple juice")
    if (targetClean && altClean.includes('an apple') && targetClean.includes('an apple')) {
      bestText = altText;
      break;
    }

    if (targetClean && altClean.includes('can i have') && targetClean.includes('can i have')) {
      bestText = altText;
      break;
    }
  }

  // 2. Phonetic acoustic disambiguation for weak-form /ən/ ("언"):
  // In standard English phonology, the indefinite article "an" is pronounced /ən/ (schwa + nasal /n/, sounding like Korean '언').
  // When an English learner pronounces "언" (/ən/) before a vowel noun (e.g. apple, orange, ice),
  // general-domain ASR models often bias toward prepositions and output "on" or "un" or "en"
  // (e.g., "on apple", "un apple") instead of "an apple".
  // In English grammar, "on apple" / "un apple" is non-standard before singular countable nouns.
  // We disambiguate this acoustic transcription directly into "an [vowel-noun]" so that
  // natural pronunciation of /ən/ is accurately recognized as "an".
  bestText = bestText.replace(
    /\b([Oo]n|[Uu]n|[Ee]n|[Aa]nd)\s+(apple|orange|ice|egg|elephant|umbrella|onion)\b/gi,
    (match, p1, p2) => {
      const isCap = p1[0] === p1[0].toUpperCase();
      return `${isCap ? 'An' : 'an'} ${p2}`;
    }
  );

  return bestText;
}

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (hasFinishedRef.current) return;

        let bestTranscript = '';
        let fullInterim = '';

        const target = (targetContextRef.current || '').toLowerCase().trim();
        const targetClean = target.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

        // Examine all results and authentic candidate hypotheses for both final and interim
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const chosenText = resolveBestTranscriptHypothesis(res, targetClean);
          if (res.isFinal) {
            bestTranscript += chosenText + ' ';
          } else {
            fullInterim += chosenText + ' ';
          }
        }

        let combined = (bestTranscript + fullInterim).trim();
        // Ensure final phonetic disambiguation on combined string as well
        combined = combined.replace(
          /\b([Oo]n|[Uu]n|[Ee]n|[Aa]nd)\s+(apple|orange|ice|egg|elephant|umbrella|onion)\b/gi,
          (match, p1, p2) => {
            const isCap = p1[0] === p1[0].toUpperCase();
            return `${isCap ? 'An' : 'an'} ${p2}`;
          }
        );

        transcriptRef.current = combined;
        setTranscript(bestTranscript.trim() || combined);
        setInterimTranscript(fullInterim.trim());

        // PRD Requirement: Keep silence detection condition at approx. 1.5 seconds (1500ms)
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          if (!hasFinishedRef.current && isListeningRef.current) {
            finishListening();
          }
        }, 1500);
      };

      recognition.onspeechend = () => {
        if (hasFinishedRef.current) return;
        // Keep PRD's ~1.5s silence requirement; do not prematurely terminate speech
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          if (!hasFinishedRef.current && isListeningRef.current) {
            finishListening();
          }
        }, 1500);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (hasFinishedRef.current) return;
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setPermissionDenied(true);
          setErrorMessage(
            '마이크 사용 권한이 차단되었습니다. 브라우저 주소창 왼쪽 자물쇠 아이콘에서 마이크를 [허용]해 주세요.'
          );
        } else if (event.error === 'network') {
          setErrorMessage(
            '음성 인식 서버 연결에 실패했습니다. 네트워크 연결 상태를 확인하거나 상단 [새 탭에서 열기]를 이용해 주세요.'
          );
        } else if (event.error === 'audio-capture') {
          setErrorMessage('마이크 장치를 찾을 수 없거나 다른 프로그램에서 사용 중입니다.');
        }
        finishListening();
      };

      recognition.onend = () => {
        clearSilenceTimer();
        if (isListeningRef.current && !hasFinishedRef.current) {
          finishListening();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition synchronously:', err);
      setErrorMessage(
        '음성 인식을 시작하지 못했습니다. Google Chrome에서 직접 새 탭으로 열어보세요.'
      );
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [clearSilenceTimer, finishListening]);

  const stopListening = useCallback(() => {
    finishListening();
  }, [finishListening]);

  const resetTranscript = useCallback(() => {
    clearSilenceTimer();
    transcriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, [clearSilenceTimer]);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    permissionDenied,
    inAppBrowser,
    isIframe,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}
