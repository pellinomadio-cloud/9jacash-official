import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { AppNotification } from '../../types/index.ts';
import { formatTelegramUrl } from '../../utils/telegram.ts';
import {
  ShieldCheck,
  X,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Clock,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Building2,
} from 'lucide-react';

export const AdminMessagePopupModal: React.FC = () => {
  const { user, notifications, dismissDirectMessagePopup, communityLinks } = useAuth();
  const [isZoomed, setIsZoomed] = useState(false);

  if (!user) return null;

  // Find the first unviewed popup notification targeted to this specific user or broadcast
  const activePopup: AppNotification | undefined = (notifications || []).find(
    (n) =>
      (n.targetUserId === user.id || n.targetUserId === 'all') &&
      n.isPopup === true &&
      !n.isViewed
  );

  if (!activePopup) return null;

  const handleCancel = () => {
    dismissDirectMessagePopup(activePopup.id);
  };

  const handleChatAgent = () => {
    const rawAgentUrl = communityLinks?.agentTelegramUrl || 'https://t.me/jacash1';
    const targetUrl = formatTelegramUrl(rawAgentUrl);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Main Popup Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-[#13141b] border-2 border-amber-500/50 rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/10 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-amber-500/20 via-[#181922] to-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-md shadow-amber-400/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white">Company Notice</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30 flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" /> Official
                  </span>
                </div>
                <p className="text-[10px] text-amber-400/90 font-mono">From 9jacash Administration</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="w-8 h-8 rounded-full bg-[#1e202b] hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cancel / Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Title & Time */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-base font-extrabold text-white leading-snug">
                  {activePopup.title}
                </h4>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{activePopup.time}</span>
                {activePopup.date && <span>• {activePopup.date}</span>}
              </div>
            </div>

            {/* Description / Message Body */}
            <div className="p-3.5 rounded-2xl bg-[#181922] border border-stone-800/80 text-xs text-stone-200 leading-relaxed whitespace-pre-line">
              {activePopup.desc}
            </div>

            {/* Screenshot Attachment Container */}
            {activePopup.screenshotUrl && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Attached Proof / Transfer Screenshot
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsZoomed(true)}
                    className="text-[10px] text-stone-400 hover:text-amber-300 flex items-center gap-1 underline cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" /> View Fullscreen
                  </button>
                </div>

                <div
                  onClick={() => setIsZoomed(true)}
                  className="relative rounded-2xl overflow-hidden border-2 border-stone-800 hover:border-amber-500/50 transition-all cursor-pointer group bg-black/60 max-h-56 flex items-center justify-center"
                >
                  <img
                    src={activePopup.screenshotUrl}
                    alt={activePopup.screenshotName || 'Admin screenshot proof'}
                    className="w-full object-contain max-h-56 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold bg-gradient-to-t from-black/80 via-transparent to-transparent">
                    <Maximize2 className="w-4 h-4 text-amber-400" /> Click to enlarge
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Cancel and Chat Agent */}
          <div className="p-4 bg-[#101117] border-t border-stone-800/80 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="py-3 px-4 rounded-xl bg-[#1c1d27] hover:bg-[#252634] border border-stone-700/60 text-stone-300 hover:text-white font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleChatAgent}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat Agent</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Lightbox Modal for Screenshot */}
      {isZoomed && activePopup.screenshotUrl && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 backdrop-blur-lg animate-in fade-in"
        >
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-stone-800 text-white flex items-center justify-center text-lg hover:bg-stone-700 transition-colors z-70 cursor-pointer shadow-xl"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <img
            src={activePopup.screenshotUrl}
            alt="Full size screenshot"
            className="max-w-full max-h-[92vh] object-contain rounded-2xl shadow-2xl border border-stone-700"
          />
        </div>
      )}
    </>
  );
};
