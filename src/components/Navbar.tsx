import React, { useState, useEffect } from 'react';
import { Store, HelpCircle, ExternalLink, Sliders } from 'lucide-react';

interface NavbarProps {
  currentScreen: 'start' | 'practice' | 'result';
  onNavigateStart: () => void;
  onOpenHelp: () => void;
  onOpenTtsSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateStart, onOpenHelp, onOpenTtsSettings }) => {
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch {
      setIsIframe(true);
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-amber-200/80 bg-amber-50/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <button
          onClick={onNavigateStart}
          className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-amber-950 tracking-tight block leading-tight">
              Snack Time!
            </span>
            <span className="text-[11px] text-amber-800/80 font-medium leading-none block">
              School Store Talk
            </span>
          </div>
        </button>

        {/* Right Action */}
        <div className="flex items-center gap-2">
          {isIframe && (
            <a
              href={typeof window !== 'undefined' ? window.location.href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-100/80 rounded-lg transition-colors border border-amber-300 shadow-2xs"
              title="미리보기 화면 밖 새 탭에서 열어 마이크를 완벽하게 사용하세요"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
              <span>새 탭에서 열기</span>
            </a>
          )}

          <button
            onClick={onOpenTtsSettings}
            aria-label="TTS Voice Settings"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-100/80 rounded-lg transition-colors border border-amber-300 shadow-2xs"
            title="Alex 음성 선택 및 브라우저 진단"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-700" />
            <span>음성 설정</span>
          </button>

          <button
            onClick={onOpenHelp}
            aria-label="How to practice"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200/80 rounded-lg transition-colors border border-amber-200"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>학습 안내</span>
          </button>
        </div>
      </div>
    </header>
  );
};

