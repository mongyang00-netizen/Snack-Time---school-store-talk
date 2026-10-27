import React from 'react';
import { AlertCircle, Chrome, Smartphone, X, ShieldCheck } from 'lucide-react';

interface BrowserNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  inAppBrowser: boolean;
  permissionDenied: boolean;
  notSupported: boolean;
}

export const BrowserNoticeModal: React.FC<BrowserNoticeModalProps> = ({
  isOpen,
  onClose,
  inAppBrowser,
  permissionDenied,
  notSupported,
}) => {
  if (!isOpen && !inAppBrowser && !permissionDenied && !notSupported) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden">
        <div className="px-5 py-4 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-100" />
            <h3 className="font-bold text-base">마이크 및 브라우저 안내</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-md hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm text-slate-700">
          {inAppBrowser && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
              <div className="flex items-start gap-2.5">
                <Smartphone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">인앱 브라우저 감지 (카카오톡/인스타그램 등)</p>
                  <p className="text-xs text-amber-800 mt-1">
                    카카오톡이나 인스타그램 앱 내에서는 마이크 음성 인식이 제한될 수 있습니다.
                  </p>
                  <p className="text-xs font-semibold text-amber-900 mt-2">
                    👉 오른쪽 상단 또는 하단의 [···] 버튼을 눌러 <strong>&quot;다른 브라우저로 열기 (Chrome / Safari)&quot;</strong>를 선택해 주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {permissionDenied && (
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">마이크 사용 권한이 필요해요</p>
                  <p className="text-xs text-rose-800 mt-1">
                    말하기 연습을 위해 주소창 왼쪽의 자물쇠/설정 아이콘을 누르고 마이크 권한을 [허용]으로 변경해 주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {notSupported && (
            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-900">
              <div className="flex items-start gap-2.5">
                <Chrome className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Google Chrome 브라우저 권장</p>
                  <p className="text-xs text-blue-800 mt-1">
                    이 웹앱은 브라우저 내장 Web Speech API를 사용합니다. 원활한 음성 인식을 위해 <strong>구글 크롬(Google Chrome)</strong> 브라우저에서 실행해 주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>학생 여러분의 음성은 텍스트 변환에만 사용되며 녹음되거나 서버에 저장되지 않습니다.</span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-xs"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
