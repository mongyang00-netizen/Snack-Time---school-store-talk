import React from 'react';
import { ShoppingBag, Sparkles, Volume2, Mic, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';
import schoolStoreHeroImg from '../assets/images/school_store_alex_unified_1793091287604.jpg';

interface StartScreenProps {
  onStartShopping: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStartShopping }) => {
  const handleStart = () => {
    soundFX.playShopBell();
    onStartShopping();
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 md:py-10 flex flex-col items-center">
      {/* Top: School Store Sign */}
      <div className="w-full text-center mb-6">
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-amber-950 tracking-tight">
          Snack Time!
        </h1>
        <p className="text-amber-800 font-medium text-sm md:text-base mt-1">
          School Store Talk — 학교 매점에서 영어로 간식 사기
        </p>
      </div>

      {/* Middle: Store Clerk & Snacks Illustration Card */}
      <div className="w-full bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-amber-200/90 text-center mb-6">
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-amber-50 shadow-inner border border-amber-100">
          <img
            src={schoolStoreHeroImg}
            alt="School store counter with friendly clerk Alex and delicious snacks"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <h2 className="font-display font-bold text-xl md:text-2xl text-amber-950">
          Let&apos;s buy some snacks in English!
        </h2>
      </div>

      {/* Bottom: Instructions & Start Button */}
      <div className="w-full bg-amber-100/50 rounded-2xl p-4 md:p-5 border border-amber-200 mb-6">
        <h3 className="font-bold text-sm text-amber-950 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>이렇게 연습해요 (How to practice)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="bg-white p-3 rounded-xl border border-amber-200/60 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <p className="font-semibold text-slate-900">들어요 (Listen)</p>
              <p className="text-slate-500 mt-0.5">점원의 질문을 듣고 목표 문장 소리를 확인해요.</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200/60 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <p className="font-semibold text-slate-900">말해요 (Speak)</p>
              <p className="text-slate-500 mt-0.5">마이크 버튼을 누르고 공손하게 주문해 봐요.</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200/60 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <p className="font-semibold text-slate-900">피드백 (Feedback)</p>
              <p className="text-slate-500 mt-0.5">틀려도 괜찮아요! 맞춤 힌트를 보고 다시 도전해요.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-display font-bold text-lg md:text-xl rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
      >
        <ShoppingBag className="w-6 h-6" />
        <span>간식 주문하러 가기 (Start Shopping)</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Privacy Notice required by technical specs */}
      <div className="mt-5 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 max-w-lg">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          Your voice is processed to turn it into text and is not recorded or saved.
          <br className="hidden sm:inline" /> (목소리는 텍스트 변환에만 사용되며 녹음되거나 저장되지 않습니다.)
        </span>
      </div>
    </div>
  );
};
