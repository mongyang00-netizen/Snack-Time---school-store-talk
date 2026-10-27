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
import { DIALOGUE_DATA, TurnRecord } from './data/dialogueData';

type ScreenType = 'start' | 'practice' | 'result';

export default function App() {
  const [screen, setScreen] = useState<ScreenType>('start');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [records, setRecords] = useState<TurnRecord[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isBrowserNoticeOpen, setIsBrowserNoticeOpen] = useState(false);

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

      {/* Footer Info */}
      <footer className="w-full py-4 px-4 border-t border-amber-200/50 bg-amber-50/50 text-center text-xs text-slate-500">
        <p>
          Snack Time! — School Store Talk
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Student ID: 2024311915 · 홍지윤
        </p>
      </footer>

      {/* Modals */}
      <BrowserNoticeModal
        isOpen={isBrowserNoticeOpen}
        onClose={() => setIsBrowserNoticeOpen(false)}
        inAppBrowser={inAppBrowser}
        permissionDenied={false}
        notSupported={!speechSupported}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
