import React, { useState, useEffect, useRef } from 'react';
import { Send, Headphones, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { SupportChatMessage, SupportChatThread } from '../../types/index.ts';
import {
  sendUserSupportMessageToFirestore,
  subscribeToUserSupportChat,
} from '../../services/firebase.ts';

interface SupportTabProps {
  onStartLiveChat?: () => void;
}

const getCacheKey = (userId: string) => `9jacash_support_chat_${userId}`;

function formatChatTime(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export const SupportTab: React.FC<SupportTabProps> = () => {
  const { user } = useAuth();
  const { isLight } = useTheme();
  const [thread, setThread] = useState<SupportChatThread | null>(() => {
    if (!user?.id) return null;
    try {
      const cached = localStorage.getItem(getCacheKey(user.id));
      return cached ? (JSON.parse(cached) as SupportChatThread) : null;
    } catch {
      return null;
    }
  });
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages: SupportChatMessage[] = Array.isArray(thread?.messages) ? thread.messages : [];
  const lastMessage = messages[messages.length - 1];
  const isWaitingForAdminReply = Boolean(lastMessage && lastMessage.sender === 'user');

  // Subscribe to real-time updates for this user's support chat thread
  useEffect(() => {
    if (!user?.id) return;

    try {
      const cached = localStorage.getItem(getCacheKey(user.id));
      if (cached) {
        setThread(JSON.parse(cached) as SupportChatThread);
      }
    } catch {
      // Ignore cache parse error
    }

    const unsub = subscribeToUserSupportChat(user.id, (remoteThread) => {
      setThread(remoteThread);
      try {
        if (remoteThread) {
          localStorage.setItem(getCacheKey(user.id), JSON.stringify(remoteThread));
        } else {
          localStorage.removeItem(getCacheKey(user.id));
        }
      } catch {
        // Ignore storage error
      }
    });

    return () => {
      unsub();
    };
  }, [user?.id]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isWaitingForAdminReply]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user?.id) {
      setErrorMsg('Please sign in to message 9jacash Support.');
      return;
    }

    // Strict turn-taking lock: user cannot send a second message until support responds
    if (isWaitingForAdminReply || isSending) {
      return;
    }

    const trimmed = inputText.trim();
    if (!trimmed) return;

    setIsSending(true);
    const res = await sendUserSupportMessageToFirestore(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
      trimmed
    );
    setIsSending(false);

    if (!res.ok) {
      if (res.thread) {
        setThread(res.thread);
      }
      setErrorMsg(res.reason || 'Unable to send message right now.');
      return;
    }

    setInputText('');
    if (res.thread) {
      setThread(res.thread);
      try {
        localStorage.setItem(getCacheKey(user.id), JSON.stringify(res.thread));
      } catch {
        // Ignore storage error
      }
    }
  };

  return (
    <div className="pt-2 pb-1 animate-in fade-in">
      <div
        className={`flex flex-col h-[calc(100dvh-185px)] min-h-[430px] rounded-2xl border overflow-hidden shadow-lg ${
          isLight
            ? 'bg-white border-stone-200 shadow-stone-200/60'
            : 'bg-[#121318] border-stone-800 shadow-black/40'
        }`}
      >
        {/* Chat Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            isLight
              ? 'bg-stone-50 border-stone-200'
              : 'bg-[#17181f] border-stone-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-black shadow-md shadow-emerald-500/20 flex-shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2
                  className={`text-sm font-extrabold tracking-tight ${
                    isLight ? 'text-stone-900' : 'text-white'
                  }`}
                >
                  9jacash Support
                </h2>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p
                className={`text-[11px] flex items-center gap-1.5 ${
                  isLight ? 'text-stone-500' : 'text-stone-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {isWaitingForAdminReply ? 'Awaiting support reply' : 'Online • Reply in chat'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Thread */}
        <div
          className={`flex-1 overflow-y-auto px-3.5 py-4 space-y-3 ${
            isLight ? 'bg-stone-50/70' : 'bg-[#0e0f14]'
          }`}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                }`}
              >
                <Headphones className="w-6 h-6" />
              </div>
              <p
                className={`text-sm font-bold ${
                  isLight ? 'text-stone-900' : 'text-white'
                }`}
              >
                Chat with 9jacash Support
              </p>
              <p
                className={`text-xs mt-1 max-w-[260px] leading-relaxed ${
                  isLight ? 'text-stone-500' : 'text-stone-400'
                }`}
              >
                Send a message below and a 9jacash support admin will reply directly here.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {!isUser && (
                    <span
                      className={`text-[10px] font-bold mb-1 px-1 ${
                        isLight ? 'text-emerald-700' : 'text-emerald-400'
                      }`}
                    >
                      9jacash Support
                    </span>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-emerald-500 text-black font-medium rounded-br-sm'
                        : isLight
                        ? 'bg-white text-stone-900 border border-stone-200 rounded-bl-sm'
                        : 'bg-[#1a1c24] text-stone-100 border border-stone-800 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <div
                      className={`text-[9px] mt-1 text-right ${
                        isUser
                          ? 'text-emerald-950/75 font-semibold'
                          : isLight
                          ? 'text-stone-400'
                          : 'text-stone-500'
                      }`}
                    >
                      {formatChatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Turn-taking lock status + Error feedback */}
        {isWaitingForAdminReply && (
          <div
            className={`px-3.5 py-2 border-t flex items-center gap-2 text-[11px] font-medium ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Message sent. You can send another message once 9jacash Support replies.
            </span>
          </div>
        )}

        {errorMsg && (
          <div
            className={`px-3.5 py-2 border-t text-[11px] font-medium ${
              isLight
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}
          >
            {errorMsg}
          </div>
        )}

        {/* Message Composer */}
        <form
          onSubmit={handleSendMessage}
          className={`p-3 border-t flex items-center gap-2 ${
            isLight
              ? 'bg-white border-stone-200'
              : 'bg-[#17181f] border-stone-800'
          }`}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isWaitingForAdminReply || isSending}
            maxLength={1000}
            placeholder={
              isWaitingForAdminReply
                ? 'Waiting for support reply...'
                : 'Type a message to 9jacash Support...'
            }
            className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs outline-none border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isLight
                ? 'bg-stone-100 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white'
                : 'bg-[#0e0f14] border-stone-800 text-white placeholder:text-stone-500 focus:border-emerald-500/60'
            }`}
          />
          <button
            type="submit"
            disabled={isWaitingForAdminReply || isSending || !inputText.trim()}
            aria-label="Send message"
            className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-black flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-md shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
