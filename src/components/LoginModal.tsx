import React, { useState, useEffect } from 'react';
import { X, Store, Sparkles, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [iframeOAuthUrl, setIframeOAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIframeOAuthUrl(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIframeOAuthUrl(null);
    setIsSubmitting(true);

    const result = await signInWithGoogle();
    if (result.error) {
      setErrorMsg(result.error);
      setIsSubmitting(false);
      return;
    }

    if (result.oauthUrl) {
      // Running inside an iframe where Google blocks embedded OAuth screens:
      // surface a direct target="_blank" link so the user can authenticate cleanly.
      setIframeOAuthUrl(result.oauthUrl);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="w-full max-w-md bg-[#faf7f2] rounded-3xl shadow-2xl border border-amber-200 flex flex-col overflow-hidden">
        {/* Top Bar matching main page header concept */}
        <div className="px-6 py-4 bg-amber-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 id="login-modal-title" className="font-display font-bold text-lg leading-tight">
                Snack Time!
              </h3>
              <p className="text-[11px] text-amber-100 font-medium leading-none mt-0.5">
                School Store Talk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 text-white/85 hover:text-white rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7 space-y-5 text-center break-keep">
          {/* Welcome Card */}
          <div className="bg-white rounded-2xl p-5 border border-amber-200/90 shadow-xs space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-semibold text-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>간편 로그인</span>
            </div>

            <h4 className="font-display font-bold text-xl sm:text-2xl text-amber-950 tracking-tight">
              학교 매점에 오신 걸 환영해요!
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Google 계정으로 로그인하고 나만의 영어 말하기 연습을 시작해 보세요.
            </p>
          </div>

          {/* Google Login Button (Only Login Method) */}
          {!iframeOAuthUrl ? (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-3.5 px-5 bg-white hover:bg-amber-50/70 active:scale-[0.99] disabled:opacity-60 text-slate-800 font-bold text-sm sm:text-base rounded-2xl border-2 border-amber-300 hover:border-amber-400 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              {/* Official Google G Mark */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>{isSubmitting ? 'Google 로그인 연결 중...' : 'Google로 계속하기'}</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3 text-left">
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                미리보기(iframe) 환경에서는 Google 보안 정책상 새 탭에서 인증을 진행해야 합니다. 아래 버튼을 눌러 로그인한 뒤 돌아와 주세요.
              </p>
              <a
                href={iframeOAuthUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-white hover:bg-amber-100/70 text-slate-900 font-bold text-sm rounded-xl border-2 border-amber-400 shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-amber-700 shrink-0" />
                <span>새 탭에서 Google 로그인 계속하기</span>
              </a>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Privacy / Reassurance Footer */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>별도의 회원가입 없이 Google 계정으로 바로 이용 가능합니다.</span>
          </div>
        </div>

        {/* Bottom Cancel/Close Area */}
        <div className="px-6 py-3.5 bg-amber-50/80 border-t border-amber-200/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-amber-100 hover:bg-amber-200/80 text-amber-950 font-bold rounded-xl text-sm transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
