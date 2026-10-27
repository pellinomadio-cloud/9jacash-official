import React from 'react';
import { X, Bell, Megaphone, Inbox, ShieldCheck, KeyRound, Sparkles, ShieldAlert } from 'lucide-react';
import { useAuth, isNotificationVisibleToUser, isGlobalBroadcastNotification } from '../../context/AuthContext.tsx';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { user, notifications } = useAuth();
  if (!isOpen) return null;

  // Show global broadcasts to all users, plus private notifications intended specifically for this user
  const userNotifications = (notifications || []).filter((n) =>
    isNotificationVisibleToUser(n, user?.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#14151b] border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-stone-200">
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Notifications</h3>
              <p className="text-[11px] text-stone-400">Official updates &amp; account alerts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-3 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {userNotifications.length === 0 ? (
            <div className="p-8 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
              <Inbox className="w-8 h-8 text-stone-600" />
              <p className="text-xs font-semibold text-stone-400">No Notifications</p>
              <p className="text-[11px] text-stone-600">Personal alerts and announcements will appear here.</p>
            </div>
          ) : (
            userNotifications.map((n) => {
              const isGlobal = isGlobalBroadcastNotification(n);
              const titleLower = (n.title || '').toLowerCase();
              const isAlert = n.type === 'alert';

              let IconComponent = Megaphone;
              if (titleLower.includes('kyc')) IconComponent = isAlert ? ShieldAlert : ShieldCheck;
              else if (titleLower.includes('code')) IconComponent = KeyRound;
              else if (!isGlobal && n.type === 'success') IconComponent = Sparkles;

              return (
                <div
                  key={n.id}
                  className="p-3 rounded-2xl bg-[#1a1c24] border border-stone-800/80 hover:border-stone-700 transition-all flex gap-3"
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                    isAlert
                      ? 'border-red-500/30 bg-red-500/15 text-red-400'
                      : isGlobal
                      ? 'border-amber-500/30 bg-amber-500/15 text-amber-400'
                      : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-white truncate max-w-[190px]">{n.title}</h4>
                        <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold ${
                          isGlobal
                            ? 'bg-amber-400/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {isGlobal ? 'Broadcast' : 'Personal'}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono flex-shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1 leading-relaxed line-clamp-3">{n.desc}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-stone-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#1c1e26] hover:bg-[#252834] text-xs font-semibold text-stone-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
