import React, { useState } from 'react';
import {
  Volume2,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  Sparkles,
  Info,
  Sliders,
  Play,
  Check,
} from 'lucide-react';

interface TtsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: SpeechSynthesisVoice[];
  activeVoice: SpeechSynthesisVoice | null;
  selectedVoiceURI: string;
  onSelectVoice: (uri: string) => void;
  onResetDefault: () => void;
  onPreviewVoice: (voice: SpeechSynthesisVoice, text?: string) => void;
  isSpeaking: boolean;
}

export const TtsSettingsModal: React.FC<TtsSettingsModalProps> = ({
  isOpen,
  onClose,
  voices,
  activeVoice,
  selectedVoiceURI,
  onSelectVoice,
  onResetDefault,
  onPreviewVoice,
  isSpeaking,
}) => {
  const [filterType, setFilterType] = useState<'us' | 'en' | 'all'>('us');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTestText, setCustomTestText] = useState("Hello! I'm Alex. How can I help you today?");

  if (!isOpen) return null;

  const enUsVoices = voices.filter(
    (v) => v.lang === 'en-US' || v.lang.toLowerCase().replace('_', '-').startsWith('en-us')
  );
  const enVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));

  const displayedVoices = voices.filter((v) => {
    if (filterType === 'us') {
      const isUs = v.lang === 'en-US' || v.lang.toLowerCase().replace('_', '-').startsWith('en-us');
      if (!isUs) return false;
    } else if (filterType === 'en') {
      const isEn = v.lang.toLowerCase().startsWith('en');
      if (!isEn) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.lang.toLowerCase().includes(q) ||
        v.voiceURI.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Detect user agent for specific OS voice guidance
  const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isChrome = typeof navigator !== 'undefined' && /chrome/i.test(navigator.userAgent) && !/edg/i.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-amber-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base md:text-lg text-amber-950 leading-tight">
                Alex 음성 설정 &amp; 브라우저 진단
              </h3>
              <p className="text-[11px] text-amber-800 font-medium leading-none mt-0.5">
                Web Speech API TTS Voice Diagnostic &amp; Selection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-amber-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Active Voice Card */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded-md tracking-wider uppercase">
                  현재 알렉스(Alex) 음성 설정
                </span>
                <h4 className="font-bold text-base md:text-lg text-amber-950 mt-1">
                  {activeVoice ? activeVoice.name : '선택된 음성 없음 (기본 음성)'}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600 font-mono">
                  <span><strong>Lang:</strong> {activeVoice?.lang || 'N/A'}</span>
                  <span><strong>Local:</strong> {activeVoice?.localService ? 'Yes (오프라인)' : 'No (온라인/서버)'}</span>
                  <span className="truncate max-w-xs" title={activeVoice?.voiceURI}>
                    <strong>voiceURI:</strong> {activeVoice?.voiceURI || 'N/A'}
                  </span>
                </div>
              </div>

              {activeVoice && (
                <button
                  onClick={() => onPreviewVoice(activeVoice, customTestText)}
                  disabled={isSpeaking}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>테스트 미리듣기</span>
                </button>
              )}
            </div>

            {/* Test custom text input */}
            <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center gap-2">
              <label className="text-[11px] font-bold text-amber-900 shrink-0">테스트 문장:</label>
              <input
                type="text"
                value={customTestText}
                onChange={(e) => setCustomTestText(e.target.value)}
                className="flex-1 px-3 py-1 text-xs bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          {/* Warnings / Diagnostic info */}
          {voices.length === 0 ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">브라우저 음성을 로딩하지 못했습니다</p>
                <p className="mt-0.5">
                  브라우저의 TTS(Speech Synthesis) 음성 목록이 아직 로딩되지 않았거나 제한되어 있습니다. 잠시 후 다시 시도해 주세요.
                </p>
              </div>
            </div>
          ) : enUsVoices.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">미국식 영어(en-US) 음성이 설치되어 있지 않습니다</p>
                <p className="mt-0.5">
                  운영체제(OS) 설정에서 고품질 미국식 영어 음성을 추가하거나 아래의 전체 English 음성 목록에서 원하는 음성을 직접 선택할 수 있습니다.
                </p>
              </div>
            </div>
          ) : null}

          {/* Browser Specific Voice Tips */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 text-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>브라우저별 음성 설정 팁 (TTS Diagnostic Guide)</span>
            </div>
            {isSafari && (
              <p className="text-[11px] leading-relaxed text-slate-600">
                🍏 <strong>Safari(macOS/iOS) 안내:</strong> Safari의 기본 미국식 영어 여성 음성(&quot;Samantha&quot; 등)이 사용되며, <em>[설정] &rarr; [손쉬운 사용] &rarr; [말하기 콘텐츠] &rarr; [음성]</em>에서 고품질 음성을 활성화하면 한층 자연스러운 음성이 출력됩니다.
              </p>
            )}
            {isChrome && (
              <p className="text-[11px] leading-relaxed text-slate-600">
                🌐 <strong>Chrome 안내:</strong> Chrome의 대표 미국식 영어 여성 음성(&quot;Google US English&quot; 등)이 사용됩니다. 아래 목록에서 선호하는 여성 음성을 자유롭게 선택할 수 있습니다.
              </p>
            )}
            {!isSafari && !isChrome && (
              <p className="text-[11px] leading-relaxed text-slate-600">
                💡 <strong>음높이(Pitch) 안내:</strong> 인위적인 음높이 조절 없이 기본값(1.0)으로 재생되며, 선호하는 음성을 선택하면 항상 유지됩니다.
              </p>
            )}
          </div>

          {/* Voice List Filter Controls */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setFilterType('us')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filterType === 'us'
                      ? 'bg-white text-amber-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  en-US ({enUsVoices.length})
                </button>
                <button
                  onClick={() => setFilterType('en')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filterType === 'en'
                      ? 'bg-white text-amber-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All English ({enVoices.length})
                </button>
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filterType === 'all'
                      ? 'bg-white text-amber-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  전체 음성 ({voices.length})
                </button>
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="음성 이름 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium bg-white"
                />
              </div>
            </div>

            {/* Voices Grid / List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {displayedVoices.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400 font-medium">
                  조건에 맞는 음성이 없습니다.
                </p>
              ) : (
                displayedVoices.map((voice) => {
                  const isSelected = selectedVoiceURI === voice.voiceURI || selectedVoiceURI === voice.name;
                  const isActive = activeVoice?.voiceURI === voice.voiceURI;

                  return (
                    <div
                      key={voice.voiceURI || voice.name}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-amber-100/70 border-amber-400 shadow-2xs'
                          : isActive
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-white border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {voice.name}
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold rounded">
                            {voice.lang}
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.5 bg-amber-600 text-white font-bold text-[10px] rounded-md flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> 선택됨
                            </span>
                          )}
                          {!isSelected && isActive && (
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded-md">
                              자동 추천 사용중
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                          {voice.voiceURI} {voice.localService ? '· (로컬/오프라인)' : '· (네트워크/온라인)'}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onPreviewVoice(voice, customTestText)}
                          disabled={isSpeaking}
                          className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <Play className="w-3 h-3 text-amber-600 fill-amber-600" />
                          <span>미리듣기</span>
                        </button>

                        <button
                          onClick={() => onSelectVoice(voice.voiceURI)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 ${
                            isSelected
                              ? 'bg-amber-700 text-white'
                              : 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isSelected ? '선택 해제' : '음성 선택'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={onResetDefault}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본 음성으로 초기화</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
