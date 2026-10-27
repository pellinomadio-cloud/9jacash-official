import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow (if installable, or always show to allow manual install prompt / guide)
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowIOSGuide(true);
          }
        }}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-3 py-2 text-xs font-extrabold text-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        title="Install Application"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Install App</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#14151b] border border-amber-500/30 p-6 space-y-4 text-stone-200">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <span>Install on iPhone / iPad</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-xs text-stone-300">
              <li>Tap the <strong className="text-amber-400">Share</strong> button in Safari toolbar at the bottom.</li>
              <li>Scroll down and tap <strong className="text-amber-400">Add to Home Screen</strong>.</li>
              <li>Tap <strong className="text-amber-400">Add</strong> in the top right corner.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-400 text-black font-bold text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
