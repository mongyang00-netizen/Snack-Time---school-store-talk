import React, { useEffect } from 'react';
import {
  ShoppingBag,
  Star,
  RotateCcw,
  CheckCircle2,
  Receipt,
  Heart,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { DIALOGUE_DATA, TurnRecord } from '../data/dialogueData';
import { soundFX } from '../utils/soundEffects';
import shoppingBagImg from '../assets/images/shopping_bag_snacks_1792748997508.jpg';

interface ResultScreenProps {
  records: TurnRecord[];
  onPracticeAgain: () => void;
  onFinish: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  records,
  onPracticeAgain,
  onFinish,
}) => {
  // Calculate skips and star rating based on Section 6
  // ⭐⭐⭐ Complete all 5 turns without skipping.
  // ⭐⭐ Complete all 5 turns with 1–2 skips.
  // ⭐ Finish the whole dialogue with 3 or more skips.
  const skipCount = records.filter((r) => r.isSkipped).length;
  const successCount = records.filter((r) => r.isSuccess).length;

  let stars = 3;
  let starSummaryTitle = '⭐⭐⭐ 완벽한 주문 완료! (Outstanding Shopper!)';
  let starSummaryDesc =
    '한 번도 건너뛰지 않고 5가지 매점 대화를 모두 영어로 멋지게 완료했어요!';

  if (skipCount === 5) {
    stars = 0;
    starSummaryTitle = '모든 문장 건너뜀 (Skipped All)';
    starSummaryDesc =
      '모든 문장을 건너뛰었어요. 다음에는 직접 말하기에 도전해 봐요!';
  } else if (skipCount >= 3) {
    stars = 1;
    starSummaryTitle = '⭐ 간식 구매 완료! (Good Effort!)';
    starSummaryDesc =
      '대화를 끝까지 완주했어요! 다음에는 건너뛰었던 표현도 용기 내어 도전해 봐요!';
  } else if (skipCount >= 1) {
    stars = 2;
    starSummaryTitle = '⭐⭐ 훌륭한 간식 주문! (Great Job!)';
    starSummaryDesc =
      '적은 건너뜀으로 훌륭하게 간식을 구매했어요! 조금만 더 연습하면 3스타!';
  }

  useEffect(() => {
    soundFX.playSuccessChime();
  }, []);

  const currentDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 md:py-10 flex flex-col items-center">
      {/* Top: Order Complete Message & Shopping Bag Illustration */}
      <div className="w-full text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>주문 및 말하기 연습 완료</span>
        </div>

        <h1 className="font-display font-black text-3xl md:text-4xl text-amber-950 tracking-tight">
          Order Complete!
        </h1>
        <p className="text-slate-600 text-sm md:text-base mt-1">
          축하합니다! 학교 매점에서 영어로 간식 주문을 성공적으로 마쳤어요!
        </p>

        {/* Shopping bag illustration */}
        <div className="w-48 h-48 md:w-56 md:h-56 mx-auto my-4 rounded-3xl overflow-hidden shadow-md border-2 border-amber-200 bg-amber-50">
          <img
            src={shoppingBagImg}
            alt="School store shopping bag with snacks"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Star Rewards Card (Reward completion, not accuracy) */}
      <div className="w-full bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-5 text-white shadow-md mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Star
              key={idx}
              className={`w-9 h-9 transition-transform ${
                idx < stars
                  ? 'fill-amber-200 text-amber-100 scale-110 drop-shadow-sm'
                  : 'text-amber-300/40'
              }`}
            />
          ))}
        </div>

        <h2 className="font-display font-bold text-xl md:text-2xl mt-1">
          {starSummaryTitle}
        </h2>
        <p className="text-amber-100 text-xs md:text-sm mt-1 max-w-md mx-auto">
          {starSummaryDesc}
        </p>

        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-amber-400/50 text-xs font-semibold">
          <div className="bg-amber-600/60 px-3 py-1.5 rounded-xl">
            말하기 성공: <span className="font-bold text-white">{successCount}</span> / 5
          </div>
          <div className="bg-amber-600/60 px-3 py-1.5 rounded-xl">
            건너뜀 (Skip): <span className="font-bold text-white">{skipCount}</span>회
          </div>
        </div>
      </div>

      {/* Middle: Digital Receipt */}
      <div className="w-full bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-amber-200 relative mb-6 font-mono text-xs text-slate-700">
        {/* Receipt Header */}
        <div className="text-center pb-4 border-b border-dashed border-slate-300">
          <div className="flex items-center justify-center gap-1.5 font-bold font-sans text-sm text-slate-900">
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>🏫 SCHOOL STORE DIGITAL RECEIPT</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Store Clerk: Alex · Cashier #01
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Date: {currentDate}</p>
        </div>

        {/* Practiced Dialogue Items */}
        <div className="py-4 space-y-3 font-sans">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <span>연습한 5가지 핵심 대화 표현</span>
            <span>상태</span>
          </div>

          {DIALOGUE_DATA.map((item, idx) => {
            const record = records.find((r) => r.turnId === item.id);
            const isSuccess = Boolean(record && record.isSuccess);
            const isSkipped = Boolean(record && record.isSkipped);

            return (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-900">
                      {item.studentTarget}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 ml-7 mt-0.5">
                    {item.studentKo}
                  </p>
                  {record?.spokenText ? (
                    <p className="text-[11px] text-amber-900 italic ml-7 mt-1">
                      🗣 내가 말한 음성: &quot;{record.spokenText}&quot;
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic ml-7 mt-1">
                      {isSkipped ? '(건너뜀 - 발화 없음)' : '(음성 녹음 없음)'}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {isSuccess ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-md">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      성공
                    </span>
                  ) : isSkipped ? (
                    <span className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-slate-600 text-[11px] font-semibold rounded-md">
                      건너뜀
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-semibold rounded-md">
                      미완료
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Receipt Totals */}
        <div className="pt-3 border-t border-dashed border-slate-300 font-mono text-xs space-y-1.5">
          <div className="flex justify-between">
            <span>1. Fresh Sandwich</span>
            <span>$2.50</span>
          </div>
          <div className="flex justify-between">
            <span>2. Apple Juice</span>
            <span>$1.50</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
            <span>TOTAL AMOUNT</span>
            <span>$4.00</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>PAYMENT (Here you are)</span>
            <span>$4.00 CASH</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>CHANGE DUE</span>
            <span>$0.00</span>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="text-center pt-4 mt-3 border-t border-dashed border-slate-300 text-[11px] text-slate-500">
          <p className="font-semibold text-slate-700">Thank you! Have a nice day! 👋</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            School Store Talk · Practice Completed
          </p>
        </div>
      </div>

      {/* Bottom: Encouraging Message & Action Buttons */}
      <div className="w-full bg-amber-50 rounded-2xl p-4 border border-amber-200 text-center mb-6 text-xs text-amber-950 font-medium">
        <p>
          &quot;Give me...&quot; 대신 <strong>&quot;Can I have..., please?&quot;</strong> 처럼
          공손하고 자연스럽게 요청하는 연습이 잘 되었나요?
          <br />
          실제 교실이나 해외 여행 매점에서도 자신 있게 영어로 말해보세요! 🥪🧃
        </p>
      </div>

      <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onPracticeAgain}
          className="w-full sm:w-1/2 py-3.5 px-4 bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-300 font-bold text-sm md:text-base rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-amber-700" />
          <span>다시 연습하기 (Practice Again)</span>
        </button>

        <button
          onClick={onFinish}
          className="w-full sm:w-1/2 py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm md:text-base rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>완료하기 (Finish)</span>
        </button>
      </div>
    </div>
  );
};
