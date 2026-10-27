import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  Mic,
  RotateCcw,
  ArrowRight,
  SkipForward,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Snail,
  VolumeX,
  AlertTriangle,
  Keyboard,
  Send,
  ExternalLink,
} from 'lucide-react';
import { DialogueTurn, FeedbackResult, TurnRecord } from '../data/dialogueData';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { evaluateSpokenTextLocally } from '../utils/speechEvaluation';
import { soundFX } from '../utils/soundEffects';
import clerkAvatarImg from '../assets/images/clerk_alex_female_avatar_1793100302805.jpg';

interface PracticeScreenProps {
  currentTurn: DialogueTurn;
  stepIndex: number;
  totalSteps: number;
  onTurnComplete: (record: TurnRecord) => void;
  onSkipTurn: (record: TurnRecord) => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  currentTurn,
  stepIndex,
  totalSteps,
  onTurnComplete,
  onSkipTurn,
}) => {
  const { speak, stop: stopSpeech, isSpeaking } = useSpeechSynthesis();

  // Attempts tracking for current step
  const [attemptCount, setAttemptCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackResult[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [activeRate, setActiveRate] = useState<number | null>(null);
  const [lastSpoken, setLastSpoken] = useState('');

  const requestTokenRef = useRef(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  const attemptCountRef = useRef(attemptCount);
  attemptCountRef.current = attemptCount;
  const failureCountRef = useRef(failureCount);
  failureCountRef.current = failureCount;
  const currentTurnRef = useRef(currentTurn);
  currentTurnRef.current = currentTurn;

  // Handle student's speech completion
  const handleTranscriptComplete = useCallback(
    async (spoken: string) => {
      soundFX.playMicBeep(false);

      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
        activeAbortControllerRef.current = null;
      }

      const turn = currentTurnRef.current;
      const rawSpoken = (spoken || '').trim();
      setLastSpoken(rawSpoken);

      const nextAttempt = attemptCountRef.current + 1;
      setAttemptCount(nextAttempt);

      // Empty speech case (Section 7)
      if (!rawSpoken) {
        const noSpeechResult = evaluateSpokenTextLocally('', turn, failureCountRef.current + 1);
        setFeedback(noSpeechResult);
        setFeedbackHistory((prev) => [...prev, noSpeechResult]);
        setIsLoadingFeedback(false);
        setFailureCount((prev) => prev + 1);
        return;
      }

      // Enter explicit analyzing state — do not prematurely confirm or chime!
      setIsLoadingFeedback(true);
      setFeedback(null);

      const thisRequestId = ++requestTokenRef.current;
      const currentFailures = failureCountRef.current + 1;
      // Pre-calculate deterministic Section 7 fallback
      const fallbackResult = evaluateSpokenTextLocally(rawSpoken, turn, currentFailures);

      let finalFeedback: FeedbackResult = fallbackResult;

      // PRD Section 7: "If Gemini does not respond, show the matching example sentence from the Section 7 table."
      // We bound the network call with a 2.5 second timeout to guarantee responsive feedback.
      const abortController = new AbortController();
      activeAbortControllerRef.current = abortController;

      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 2500);

      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spokenText: rawSpoken,
            turnId: turn.id,
            failureAttemptNumber: currentFailures,
          }),
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data && typeof data.success === 'boolean') {
            finalFeedback = {
              success: data.success,
              category: data.category || fallbackResult.category,
              feedbackEn: data.feedbackEn || fallbackResult.feedbackEn,
              feedbackKo: data.feedbackKo || fallbackResult.feedbackKo,
              recognizedText: data.recognizedText || rawSpoken,
              missingWord: data.missingWord || fallbackResult.missingWord,
              hint: data.hint || fallbackResult.hint,
            };
          }
        }
      } catch {
        // If timeout or network failure occurs, seamlessly fall back to PRD Section 7 rule-based feedback
        clearTimeout(timeoutId);
        finalFeedback = fallbackResult;
      } finally {
        clearTimeout(timeoutId);
        if (activeAbortControllerRef.current === abortController) {
          activeAbortControllerRef.current = null;
        }
      }

      // Guard: Ignore if user has moved on to another attempt or turn
      if (thisRequestId !== requestTokenRef.current) {
        return;
      }

      setIsLoadingFeedback(false);
      setFeedback(finalFeedback);
      setFeedbackHistory((prev) => [...prev, finalFeedback]);

      // Success chime ONLY on verified success!
      if (finalFeedback.success) {
        soundFX.playSuccessChime();
      } else {
        setFailureCount((prev) => prev + 1);
      }
    },
    []
  );

  const [isTextInputOpen, setIsTextInputOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    permissionDenied,
    errorMessage,
    isIframe,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onTranscriptComplete: handleTranscriptComplete,
    targetContext: currentTurn.studentTarget,
  });

  useEffect(() => {
    // Reset state for new turn
    requestTokenRef.current += 1;
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    stopListening();
    resetTranscript();
    setAttemptCount(0);
    setFailureCount(0);
    setFeedback(null);
    setFeedbackHistory([]);
    setLastSpoken('');
    setIsLoadingFeedback(false);

    // Automatically speak clerk Alex's question aloud once when entering each turn
    const timer = setTimeout(() => {
      speak(currentTurn.partnerEn, 0.9);
    }, 400);

    return () => {
      clearTimeout(timer);
      stopSpeech();
      stopListening();
    };
    // ONLY re-run this effect when currentTurn.id changes, never when callbacks recreate!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn.id]);

  // Replay clerk question
  const handlePlayPartner = () => {
    setActiveRate(null);
    speak(currentTurn.partnerEn, 0.9);
  };

  // Play target sentence: normal rate 0.9
  const handlePlayTargetNormal = () => {
    setActiveRate(0.9);
    speak(currentTurn.studentTarget, 0.9, () => setActiveRate(null));
  };

  // Play target sentence: slow rate 0.7
  const handlePlayTargetSlow = () => {
    setActiveRate(0.7);
    speak(currentTurn.studentTarget, 0.7, () => setActiveRate(null));
  };

  // Mic click handler
  const handleMicClick = () => {
    if (isSpeaking) {
      stopSpeech();
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Try again
  const handleTryAgain = () => {
    requestTokenRef.current += 1;
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    resetTranscript();
    setIsLoadingFeedback(false);
    setFeedback(null);
    setLastSpoken('');
    startListening();
  };

  // Next step
  const handleNext = () => {
    stopSpeech();
    if (isListening) {
      stopListening();
    }
    // Cannot advance without recorded speech feedback
    if (attemptCount === 0 || !feedback) {
      return;
    }
    const isSuccess = Boolean(feedback && feedback.success);
    const turnSpoken = (lastSpoken || transcript).trim();
    onTurnComplete({
      turnId: currentTurn.id,
      targetSentence: currentTurn.studentTarget,
      spokenText: turnSpoken,
      isSuccess,
      isSkipped: false,
      attempts: attemptCount,
      feedbackHistory,
    });
  };

  // Skip step
  const handleSkip = () => {
    stopSpeech();
    if (isListening) {
      stopListening();
    }
    // Fix: Only record speech for this turn if the learner actually spoke or attempted in this specific turn.
    // If skipped without speaking, never carry over stale text from a previous step!
    const turnSpoken = attemptCount > 0 ? (lastSpoken || transcript).trim() : '';
    onSkipTurn({
      turnId: currentTurn.id,
      targetSentence: currentTurn.studentTarget,
      spokenText: turnSpoken,
      isSuccess: false,
      isSkipped: true,
      attempts: attemptCount,
      feedbackHistory,
    });
  };

  // Manual text input submit
  const handleManualSubmit = (overrideText?: string) => {
    const textToSubmit = (overrideText !== undefined ? overrideText : manualInput).trim();
    if (!textToSubmit) return;
    setManualInput('');
    handleTranscriptComplete(textToSubmit);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-5 flex flex-col gap-5">
      {/* Top: Progress and Store Clerk Speech Bubble */}
      <div>
        {/* Progress Bar & Indicators */}
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-amber-950">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-amber-200/80 font-bold">
              Step {stepIndex + 1} of {totalSteps}
            </span>
            <span className="text-amber-800 font-medium">Buying Snacks</span>
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === stepIndex
                    ? 'w-6 bg-amber-500'
                    : idx < stepIndex
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-amber-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Store Clerk Alex & Authentic Speech Bubble */}
        <div className="flex items-start gap-3 md:gap-4 relative">
          {/* Clerk Alex Avatar (Unified female character in blue apron) */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative">
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 shadow-sm bg-amber-100 transition-all ${
                  isSpeaking ? 'ring-4 ring-amber-400 border-amber-500 scale-105' : 'border-amber-300'
                }`}
              >
                <img
                  src={clerkAvatarImg}
                  alt="Store Clerk Alex"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded-md shadow-xs">
                Alex
              </span>
            </div>
            {isSpeaking && (
              <span className="text-[10px] font-bold text-amber-700 mt-1 animate-pulse flex items-center gap-0.5">
                <Volume2 className="w-3 h-3" /> 말하는 중...
              </span>
            )}
          </div>

          {/* Speech Bubble Container with authentic speech bubble tail */}
          <div className="flex-1 min-w-0 relative bg-white rounded-3xl p-4 md:p-5 shadow-sm border-2 border-amber-300">
            {/* Visual speech bubble tail pointing directly to Alex */}
            <div className="absolute -left-3 top-5 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-[12px] border-r-amber-300" />
            <div className="absolute -left-2 top-5 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-[12px] border-r-white" />

            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  School Store Clerk (점원 Alex)
                </span>
                {stepIndex === 0 && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md border border-amber-200">
                    첫인사 (Greeting)
                  </span>
                )}
              </div>
              <button
                onClick={handlePlayPartner}
                disabled={isSpeaking}
                className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-100/80 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                title="다시 듣기"
              >
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">다시 듣기</span>
              </button>
            </div>

            <p className="font-display font-bold text-lg md:text-xl text-slate-900 leading-snug">
              &quot;{currentTurn.partnerEn}&quot;
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {currentTurn.partnerKo}
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Student Target Sentence Card with Listen & Slow Buttons */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-amber-200 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-semibold text-amber-800 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>내가 말할 문장 (Your Target Sentence)</span>
        </div>

        {/* Target sentence in the largest text */}
        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-amber-950 tracking-tight leading-tight px-2">
          &ldquo;{currentTurn.studentTarget}&rdquo;
        </h2>

        {/* Korean meaning */}
        <p className="text-sm md:text-base text-slate-600 font-medium mt-2">
          {currentTurn.studentKo}
        </p>

        {/* Key words highlight for student ease */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
          <span className="text-[11px] font-semibold text-amber-700">핵심 단어:</span>
          {currentTurn.keyWords.map((kw, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-amber-100/60 text-amber-900 rounded-md font-medium"
            >
              {kw}
            </span>
          ))}
        </div>

        {/* Listen and Slow buttons */}
        <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-amber-100">
          <button
            onClick={handlePlayTargetNormal}
            disabled={isSpeaking}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shadow-xs ${
              activeRate === 0.9
                ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                : 'bg-amber-100/80 hover:bg-amber-200/90 text-amber-900'
            }`}
          >
            <Volume2 className="w-4 h-4 text-amber-700" />
            <span>🔊 Listen (기본 속도)</span>
          </button>

          <button
            onClick={handlePlayTargetSlow}
            disabled={isSpeaking}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shadow-xs ${
              activeRate === 0.7
                ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                : 'bg-orange-100/80 hover:bg-orange-200/90 text-orange-900'
            }`}
          >
            <Snail className="w-4 h-4 text-orange-700" />
            <span>🐢 Slow (느리게 듣기)</span>
          </button>
        </div>
      </div>

      {/* Bottom: Mic Button & Dynamic States */}
      <div className="bg-amber-100/40 rounded-3xl p-5 border border-amber-200 flex flex-col items-center text-center">
        {/* Large Mic Button with the 3 distinct states required */}
        <div className="relative my-2">
          {isListening && (
            <div className="absolute inset-0 rounded-full animate-mic-pulse" />
          )}

          <button
            onClick={handleMicClick}
            disabled={isSpeaking}
            aria-label={
              isSpeaking
                ? '오디오 재생 중에는 마이크가 비활성화됩니다'
                : isListening
                ? '말하기 중단'
                : '마이크를 누르고 말하세요'
            }
            className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer ${
              isSpeaking
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                : isListening
                ? 'bg-rose-500 text-white ring-4 ring-rose-200'
                : feedback?.success
                ? 'bg-emerald-500 text-white ring-4 ring-emerald-200'
                : lastSpoken && !feedback?.success && !isLoadingFeedback
                ? 'bg-amber-500 text-white ring-4 ring-amber-200'
                : 'bg-slate-600 hover:bg-slate-700 text-white'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-8 h-8" />
                <span className="text-[10px] font-bold">재생 중...</span>
              </>
            ) : isListening ? (
              <>
                <Mic className="w-8 h-8 animate-bounce" />
                <span className="text-[10px] font-bold">Listening...</span>
              </>
            ) : feedback?.success ? (
              <>
                <CheckCircle2 className="w-8 h-8" />
                <span className="text-[10px] font-bold">Speech recorded!</span>
              </>
            ) : isLoadingFeedback ? (
              <>
                <Sparkles className="w-8 h-8 animate-spin" />
                <span className="text-[10px] font-bold">Checking...</span>
              </>
            ) : lastSpoken ? (
              <>
                <CheckCircle2 className="w-8 h-8" />
                <span className="text-[10px] font-bold">Speech recorded!</span>
              </>
            ) : (
              <>
                <Mic className="w-8 h-8" />
                <span className="text-[10px] font-bold">Tap to speak</span>
              </>
            )}
          </button>
        </div>

        {/* State Label */}
        <div className="text-center mt-2">
          {isListening && (
            <div className="flex items-center justify-center gap-1 my-1.5 h-4">
              <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:0ms]"></span>
              <span className="w-1 h-5 bg-rose-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
              <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
              <span className="w-1 h-6 bg-rose-500 rounded-full animate-bounce [animation-delay:450ms]"></span>
              <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:200ms]"></span>
            </div>
          )}

          <p className="font-semibold text-sm text-slate-800">
            {isSpeaking
              ? '점원 또는 예시 문장 소리가 끝난 후 말씀해 주세요.'
              : isListening
              ? '듣고 있어요! 편안하게 말씀하세요... (Listening)'
              : isLoadingFeedback
              ? 'Alex가 답변을 듣고 확인하고 있어요...'
              : feedback?.success
              ? '말하기가 인식되었어요! 피드백을 확인해 보세요.'
              : '마이크를 누르고 목표 문장을 영어로 말해보세요.'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isListening
              ? '말을 멈추면 약 1.5초 후 자동으로 인식이 완료됩니다.'
              : '마이크를 누르고 영어로 말하면 1.5초 후 자동 인식됩니다.'}
          </p>
          {isListening && (
            <button
              onClick={() => stopListening()}
              className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>말하기 완료 (피드백 받기)</span>
            </button>
          )}
        </div>

        {/* Microphone Error / Permission Denied Banner with explicit error differentiation */}
        {(permissionDenied || errorMessage || !isSupported) && (
          <div className="w-full mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-left text-xs text-rose-900 shadow-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-950">
                  {permissionDenied
                    ? '마이크 사용 권한이 필요합니다'
                    : !isSupported
                    ? '브라우저 음성 인식 미지원 (Chrome 권장)'
                    : '음성 인식 연결 안내'}
                </p>
                <p className="text-rose-800 mt-0.5 leading-relaxed">
                  {errorMessage ||
                    '브라우저 주소창 왼쪽의 자물쇠 아이콘을 눌러 마이크 권한을 [허용]으로 변경해 주세요.'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    onClick={handleMicClick}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition-colors"
                  >
                    마이크 다시 시도
                  </button>
                  {isIframe && (
                    <a
                      href={typeof window !== 'undefined' ? window.location.href : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>새 탭에서 열기 (권장)</span>
                    </a>
                  )}
                  <button
                    onClick={() => setIsTextInputOpen(true)}
                    className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg font-semibold text-[11px] transition-colors"
                  >
                    키보드로 연습하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Input Fallback Drawer */}
        <div className="w-full mt-3">
          <button
            onClick={() => setIsTextInputOpen(!isTextInputOpen)}
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center justify-center gap-1 mx-auto py-1"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>
              {isTextInputOpen
                ? '키보드 입력창 닫기'
                : '마이크가 잘 안 되나요? 키보드로 직접 입력하기'}
            </span>
          </button>

          {isTextInputOpen && (
            <div className="mt-2 p-3 bg-white rounded-2xl border border-amber-200 text-left shadow-xs space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                영어로 직접 문장을 입력하여 피드백 테스트하기:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleManualSubmit();
                  }}
                  placeholder={currentTurn.studentTarget}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <button
                  onClick={() => handleManualSubmit()}
                  disabled={!manualInput.trim()}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>제출</span>
                </button>
              </div>

              {/* Quick sample buttons for convenient testing */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-slate-400 font-medium">빠른 테스트:</span>
                <button
                  onClick={() => handleManualSubmit(currentTurn.studentTarget)}
                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 font-medium"
                >
                  정답 문장
                </button>
                <button
                  onClick={() => {
                    const tokens = currentTurn.studentTarget.split(' ');
                    const missingOne = tokens.filter((w) => w.toLowerCase() !== 'a' && w.toLowerCase() !== 'an').join(' ');
                    handleManualSubmit(missingOne);
                  }}
                  className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md border border-amber-200 font-medium"
                >
                  작은 단어 빠짐
                </button>
                <button
                  onClick={() => handleManualSubmit('Give me snacks please')}
                  className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-md border border-rose-200 font-medium"
                >
                  잘못된 표현 (Give me)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recognized Transcript Display */}
        {(lastSpoken || transcript || interimTranscript) && (attemptCount > 0 || isListening) && (
          <div className="w-full mt-3 p-3 bg-white rounded-xl border border-amber-200/80 text-left text-xs">
            <span className="font-bold text-amber-900 block mb-1">
              내가 말한 내용 (You said):
            </span>
            <p className="text-slate-800 font-medium text-sm italic">
              &ldquo;{lastSpoken || transcript || interimTranscript}&rdquo;
            </p>
          </div>
        )}

        {/* Explicit Analyzing Feedback Card while Gemini evaluates */}
        {isLoadingFeedback && (
          <div className="w-full mt-4 p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/90 text-left text-sm shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-amber-950">
                    Alex가 답변을 듣고 확인하고 있어요...
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Alex is checking your sentence... 잠시만 기다려 주세요!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Short Feedback Box (Section 7) - Displays once final analysis is complete */}
        {feedback && !isLoadingFeedback && (
          <div
            className={`w-full mt-4 p-4 rounded-2xl border text-left text-sm transition-all shadow-xs ${
              feedback.success
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  feedback.success
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {feedback.success ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs">
                    {feedback.success ? '🎉 통과 (Success)' : '💡 알렉스의 팁 (Alex\'s Tip)'}
                  </span>
                  {!feedback.success && failureCount > 0 && (
                    <span className="text-[10px] text-amber-800 font-medium">
                      도전 {failureCount}회차
                    </span>
                  )}
                </div>

                <p className="font-semibold text-sm mt-1 leading-snug">
                  {feedback.feedbackEn}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {feedback.feedbackKo}
                </p>

                {/* Specific hint visual if failure */}
                {!feedback.success && feedback.hint && (
                  <div className="mt-2.5 p-2 bg-white rounded-lg border border-amber-200 text-xs">
                    <span className="text-amber-800 font-bold block mb-0.5">
                      {feedback.category === 'elicitation'
                        ? '🔤 첫 글자 힌트 (First-Letter Hint):'
                        : feedback.category === 'chunking'
                        ? '✂️ 나누어 말하기 힌트 (Chunks):'
                        : '🎯 목표 문장 다시 보기:'}
                    </span>
                    <span className="font-mono font-bold text-amber-950 text-sm">
                      {feedback.hint}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons: Try Again, Next, Skip */}
        <div className="w-full flex flex-col gap-2 mt-5 pt-3 border-t border-amber-200/80">
          <div className="w-full flex items-center justify-between gap-2">
            <button
              onClick={handleSkip}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-xl transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>건너뛰기 (Skip)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTryAgain}
                disabled={isSpeaking || isListening || isLoadingFeedback || attemptCount === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 bg-white hover:bg-amber-50 rounded-xl border border-amber-300 shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>다시 말하기 (Try Again)</span>
              </button>

              <button
                onClick={handleNext}
                disabled={isLoadingFeedback || attemptCount === 0 || !feedback}
                title={
                  attemptCount === 0
                    ? '마이크로 음성을 녹음한 후 다음 단계로 이동할 수 있습니다.'
                    : undefined
                }
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  feedback?.success
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                <span>{stepIndex + 1 === totalSteps ? '결과 확인하기' : '다음 단계 (Next)'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Guide message if user hasn't recorded yet */}
          {attemptCount === 0 && (
            <p className="text-[11px] text-amber-900/80 text-center font-medium">
              🎙️ 마이크를 누르고 말해 보세요! (말하기 없이 넘어가려면 왼쪽 &apos;건너뛰기&apos;를 눌러주세요)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
