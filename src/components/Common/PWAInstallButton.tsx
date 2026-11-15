import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';
import { Download, Smartphone, X, CheckCircle2, ExternalLink, MoreVertical } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isInAppBrowser,
    install,
    openInAndroidChrome,
  } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      const outcome = await install();
      if (outcome === 'unavailable') {
        setShowInstallModal(true);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-3 py-2 text-xs font-extrabold text-black shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-70"
        title="Install 9jacash App"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
      </button>

      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#11131a] border border-amber-500/35 p-6 space-y-4 text-stone-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3.5">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png?v=4"
                  alt="9jacash App Icon"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl border border-amber-400/50 shadow-lg shadow-amber-500/20 object-cover shrink-0"
                />
                <div>
                  <h3 className="font-extrabold text-base text-white leading-tight">
                    Install 9jacash App
                  </h3>
                  <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Official Mobile Application</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              /* iOS (iPhone / iPad) Instructions ONLY on Apple devices */
              <div className="space-y-3">
                <p className="text-xs text-stone-300 leading-relaxed">
                  Add <strong className="text-white">9jacash</strong> to your iPhone or iPad home screen:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs text-stone-300 bg-[#181b24] border border-stone-800 rounded-2xl p-3.5">
                  <li>
                    Tap the <strong className="text-amber-400">Share</strong> button at the bottom of your browser.
                  </li>
                  <li>
                    Scroll down and tap <strong className="text-amber-400">Add to Home Screen</strong>.
                  </li>
                  <li>
                    Tap <strong className="text-amber-400">Add</strong> in the top-right corner.
                  </li>
                </ol>
              </div>
            ) : (
              /* Android & Chrome Direct Install Flow (NEVER mentions Safari) */
              <div className="space-y-3.5">
                {isInstallable ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await install();
                      if (res !== 'unavailable') {
                        setShowInstallModal(false);
                      }
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Install Now to Phone</span>
                  </button>
                ) : isAndroid && isInAppBrowser ? (
                  <div className="space-y-3">
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Tap below to launch <strong className="text-amber-400">Google Chrome</strong> and install the <strong className="text-white">9jacash App</strong> directly onto your Android device:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        openInAndroidChrome();
                        setShowInstallModal(false);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                      <span>Open in Chrome &amp; Install App</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs text-stone-300 leading-relaxed">
                      To finish installing the <strong className="text-white">9jacash App</strong> onto your Android phone home screen:
                    </p>
                    <ol className="space-y-2.5 text-xs text-stone-200 bg-[#181b24] border border-stone-800 rounded-2xl p-3.5">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          Tap the <strong className="text-amber-400 inline-flex items-center gap-0.5"><MoreVertical className="w-3.5 h-3.5 inline" /> menu icon</strong> at the top-right corner of Chrome.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <span>
                          Tap <strong className="text-amber-400 flex-inline items-center gap-1"><Smartphone className="w-3.5 h-3.5 inline mr-1" />Install app</strong> (or <strong className="text-amber-400">Add to Home screen</strong>).
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <span>
                          Tap <strong className="text-amber-400">Install</strong> to add the 9jacash icon to your phone.
                        </span>
                      </li>
                    </ol>
                    {isAndroid && (
                      <button
                        type="button"
                        onClick={() => {
                          openInAndroidChrome();
                          setShowInstallModal(false);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Chrome Browser</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
