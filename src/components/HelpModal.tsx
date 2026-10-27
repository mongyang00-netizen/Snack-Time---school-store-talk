import React from 'react';
import { X, HelpCircle, Star, ShieldCheck, MessageCircle, Sparkles } from 'lucide-react';
import { DIALOGUE_DATA } from '../data/dialogueData';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-amber-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-100" />
            <h3 className="font-display font-bold text-lg">학습 가이드 (Study Guide)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/15"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>학습 목표 (Learning Goal)</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              &quot;Give me...&quot; 와 같은 지나치게 직설적인 표현 대신,
              <strong> &quot;Can I have... please?&quot;</strong> 처럼 공손하고 자연스러운 표현을 익혀
              학교 매점에서 간식을 직접 구매할 수 있습니다. (CEFR A1-A2 수준)
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
              <MessageCircle className="w-4 h-4 text-amber-600" />
              <span>연습 대화 5단계 (Dialogue Steps)</span>
            </h4>
            <div className="space-y-2 text-xs">
              {DIALOGUE_DATA.map((t) => (
                <div key={t.id} className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                  <p className="font-semibold text-amber-950">
                    {t.id}. 점원: &quot;{t.partnerEn}&quot; ({t.partnerKo})
                  </p>
                  <p className="text-slate-800 font-bold mt-1">
                    👉 학생: &quot;{t.studentTarget}&quot; ({t.studentKo})
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>별점 기준 (Star Rewards)</span>
            </h4>
            <ul className="text-xs space-y-1 text-slate-600 list-disc list-inside">
              <li>⭐⭐⭐ : 스킵 없이 5단계를 모두 완료한 경우</li>
              <li>⭐⭐ : 1~2회 스킵하고 완료한 경우</li>
              <li>⭐ : 3회 이상 스킵하고 완료한 경우</li>
            </ul>
            <p className="text-[11px] text-slate-500 mt-1">
              * 완성을 장려하기 위한 보상으로, 발음 점수나 퍼센트(%)는 매기지 않습니다.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">개인정보 및 음성 보호 원칙</p>
              <p className="mt-0.5">
                음성 데이터는 브라우저에서 텍스트로 즉시 변환되며 음성 파일 자체는 절대 녹음되거나 외부 서버에 저장되지 않습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
