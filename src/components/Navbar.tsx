import React, { useState, useEffect, useRef } from 'react';
import { Store, HelpCircle, ExternalLink, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  currentScreen: 'start' | 'practice' | 'result';
  onNavigateStart: () => void;
  onOpenHelp: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateStart,
  onOpenHelp,
  onOpenLogin,
}) => {
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const [isIframe, setIsIframe] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch {
      setIsIframe(true);
    }
  }, []);

  // Reset image error state if avatar URL changes
  const avatarUrl =
    profile?.avatar_url ||
    (typeof user?.user_metadata?.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : null) ||
    (typeof user?.user_metadata?.picture === 'string'
      ? user.user_metadata.picture
      : null);

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  // Close popover when clicking outside (for touch devices)
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const displayName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : null) ||
    (typeof user?.user_metadata?.name === 'string'
      ? user.user_metadata.name
      : null) ||
    '학생';

  const displayEmail = profile?.email || user?.email || '';

  const handleSignOut = async () => {
    setIsPopoverOpen(false);
    await signOut();
    onNavigateStart();
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-amber-200/80 bg-amber-50/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Zone */}
        <button
          onClick={onNavigateStart}
          className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-1 shrink-0 cursor-pointer"
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isIframe && (
            <a
              href={typeof window !== 'undefined' ? window.location.href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-100/80 rounded-lg transition-colors border border-amber-300 shadow-2xs whitespace-nowrap"
              title="미리보기 화면 밖 새 탭에서 열어 마이크를 완벽하게 사용하세요"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
              <span>새 탭에서 열기</span>
            </a>
          )}

          <button
            onClick={onOpenHelp}
            aria-label="How to practice"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200/80 rounded-lg transition-colors border border-amber-200 whitespace-nowrap cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>학습 안내</span>
          </button>

          {isAuthenticated ? (
            <div
              ref={popoverRef}
              className="relative"
              onMouseEnter={() => setIsPopoverOpen(true)}
              onMouseLeave={() => setIsPopoverOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsPopoverOpen((prev) => !prev)}
                aria-label="사용자 프로필"
                aria-expanded={isPopoverOpen}
                className="flex items-center gap-2 p-0.5 rounded-full border-2 border-amber-300 hover:border-amber-500 bg-white shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {avatarUrl && !avatarFailed ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* Hover / Click Popover with Sign Out below */}
              {isPopoverOpen && (
                <div className="absolute right-0 top-full pt-2 w-56 z-50">
                  <div className="bg-white rounded-2xl shadow-xl border border-amber-200 p-3 text-left">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-amber-100">
                      {avatarUrl && !avatarFailed ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-amber-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {displayName}
                        </p>
                        {displayEmail && (
                          <p className="text-[11px] text-slate-500 truncate">
                            {displayEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                onOpenLogin();
              }}
              aria-label="로그인"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-100/80 rounded-lg transition-colors border border-amber-300 shadow-2xs whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>로그인</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
