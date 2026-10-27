/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StartScreen } from './components/StartScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { ResultScreen } from './components/ResultScreen';
import { BrowserNoticeModal } from './components/BrowserNoticeModal';
import { HelpModal } from './components/HelpModal';
import { TtsSettingsModal } from './components/TtsSettingsModal';
import { DIALOGUE_DATA, TurnRecord } from './data/dialogueData';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';

type ScreenType = 'start' | 'practice' | 'result';

export default function App() {
  const [screen, setScreen] = useState<ScreenType>('start');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [records, setRecords] = useState<TurnRecord[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isBrowserNoticeOpen, setIsBrowserNoticeOpen] = useState(false);
  const [isTtsSettingsOpen, setIsTtsSettingsOpen] = useState(false);

  // Global Speech Synthesis instance for settings modal
  const {
    voices,
    activeVoice,
    selectedVoiceURI,
    setSelectedVoiceURI,
    resetVoiceToDefault,
    previewVoice,
    isSpeaking,
  } = useSpeechSynthesis();

  // Browser environmental checks
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || '';
      const isInApp = /KAKAOTALK|Instagram|FBAN|FBAV|Line|Twitter/i.test(ua);
      if (isInApp) {
        setInAppBrowser(true);
        setIsBrowserNoticeOpen(true);
      }

      const SpeechRecognitionClass =
        (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

      if (!SpeechRecognitionClass) {
        setSpeechSupported(false);
      }
    }
  }, []);

  const handleStartShopping = () => {
    setRecords([]);
    setCurrentStepIndex(0);
    setScreen('practice');
  };

  const handleTurnComplete = (record: TurnRecord) => {
    const updated = [...records.filter((r) => r.turnId !== record.turnId), record];
    setRecords(updated);

    if (currentStepIndex + 1 < DIALOGUE_DATA.length) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setScreen('result');
    }
  };

  const handleSkipTurn = (record: TurnRecord) => {
    const updated = [...records.filter((r) => r.turnId !== record.turnId), record];
    setRecords(updated);

    if (currentStepIndex + 1 < DIALOGUE_DATA.length) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setScreen('result');
    }
  };

  const handlePracticeAgain = () => {
    setRecords([]);
    setCurrentStepIndex(0);
    setScreen('practice');
  };

  const handleFinish = () => {
    setRecords([]);
    setCurrentStepIndex(0);
    setScreen('start');
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col text-slate-800 selection:bg-amber-200 selection:text-amber-900">
      {/* Top Bar */}
      <Navbar
        currentScreen={screen}
        onNavigateStart={() => setScreen('start')}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenTtsSettings={() => setIsTtsSettingsOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
        {screen === 'start' && (
          <StartScreen onStartShopping={handleStartShopping} />
        )}

        {screen === 'practice' && (
          <PracticeScreen
            currentTurn={DIALOGUE_DATA[currentStepIndex]}
            stepIndex={currentStepIndex}
            totalSteps={DIALOGUE_DATA.length}
            onTurnComplete={handleTurnComplete}
            onSkipTurn={handleSkipTurn}
          />
        )}

        {screen === 'result' && (
          <ResultScreen
            records={records}
            onPracticeAgain={handlePracticeAgain}
            onFinish={handleFinish}
          />
        )}
      </main>



      {/* Modals */}
      <BrowserNoticeModal
        isOpen={isBrowserNoticeOpen}
        onClose={() => setIsBrowserNoticeOpen(false)}
        inAppBrowser={inAppBrowser}
        permissionDenied={false}
        notSupported={!speechSupported}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <TtsSettingsModal
        isOpen={isTtsSettingsOpen}
        onClose={() => setIsTtsSettingsOpen(false)}
        voices={voices}
        activeVoice={activeVoice}
        selectedVoiceURI={selectedVoiceURI}
        onSelectVoice={setSelectedVoiceURI}
        onResetDefault={resetVoiceToDefault}
        onPreviewVoice={previewVoice}
        isSpeaking={isSpeaking}
      />
    </div>
  );
}

