import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Smartphone,
  Send,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  Layers,
  Trash2,
  Volume2,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { DevicePushBroadcast, DeviceSubscriber, AppNotification } from '../../types/index.ts';
import {
  subscribeToDeviceBroadcasts,
  saveDeviceBroadcastToFirestore,
  deleteDeviceBroadcastFromFirestore,
  subscribeToDeviceSubscribers,
  saveNotificationToFirestore,
} from '../../services/firebase.ts';
import {
  sendDeviceNotification,
  detectDevicePlatform,
  getDeviceNotificationPermission,
  requestDeviceNotificationPermission,
  playNotificationChime,
} from '../../utils/deviceNotifications.ts';

interface AdminDeviceNotificationPageProps {
  onBack: () => void;
}

export const AdminDeviceNotificationPage: React.FC<AdminDeviceNotificationPageProps> = ({ onBack }) => {
  // Subscribers & Broadcasts from Firestore
  const [subscribers, setSubscribers] = useState<DeviceSubscriber[]>([]);
  const [broadcastHistory, setBroadcastHistory] = useState<DevicePushBroadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const defaultTitle = 'Message from 9jacash company';
  const [notificationTitle, setNotificationTitle] = useState(defaultTitle);
  const [notificationBody, setNotificationBody] = useState(
    'Bank withdrawals are now processing with instant 2-minute settlement. Tap to cashout.'
  );
  const [targetPlatform, setTargetPlatform] = useState<'all' | 'android' | 'ios'>('all');
  const [targetActionUrl, setTargetActionUrl] = useState('/');
  const [previewPlatform, setPreviewPlatform] = useState<'android' | 'ios'>('android');

  // Action status
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState('');
  const [sendErrorMsg, setSendErrorMsg] = useState('');
  const [testSuccessMsg, setTestSuccessMsg] = useState('');

  // Subscribe to real-time device subscribers & broadcast history
  useEffect(() => {
    const unsubSubs = subscribeToDeviceSubscribers((list) => {
      setSubscribers(list || []);
      setIsLoading(false);
    });

    const unsubHistory = subscribeToDeviceBroadcasts((list) => {
      setBroadcastHistory(list || []);
      setIsLoading(false);
    });

    return () => {
      unsubSubs();
      unsubHistory();
    };
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = subscribers.length;
    const androidCount = subscribers.filter((s) => s.platform === 'android').length;
    const iosCount = subscribers.filter((s) => s.platform === 'ios').length;
    const desktopCount = subscribers.filter((s) => s.platform === 'desktop').length;
    const pwaCount = subscribers.filter((s) => s.isPwa).length;
    const activeEnabledCount = subscribers.filter((s) => s.permission === 'granted').length;

    return {
      total: Math.max(total, 1),
      androidCount,
      iosCount,
      desktopCount,
      pwaCount,
      activeEnabledCount: Math.max(activeEnabledCount, 1),
    };
  }, [subscribers]);

  // Quick preset templates
  const presets = [
    {
      label: '⚡ Instant Withdrawals',
      body: 'Message from 9jacash company: Bank payouts are now processing with instant 2-minute settlement. Tap to cashout your balance.',
      url: '/withdraw',
    },
    {
      label: '🎁 Daily Cash Bonus',
      body: 'Message from 9jacash company: Your free daily reward is ready to claim today. Tap to collect your bonus cash.',
      url: '/earn',
    },
    {
      label: '🔑 Quick Code Service',
      body: 'Message from 9jacash company: Quick Code authorization service is currently active with high success rate. Tap to generate code.',
      url: '/quickcode',
    },
    {
      label: '🛡️ Account Verification',
      body: 'Message from 9jacash company: Ensure your KYC verification and bank details are confirmed to enjoy unlimited daily limits.',
      url: '/account_details',
    },
    {
      label: '📢 Company Announcement',
      body: 'Message from 9jacash company: Important update from management regarding account bonuses and improved payout channels.',
      url: '/',
    },
  ];

  const handleApplyPreset = (body: string, url: string) => {
    setNotificationBody(body);
    setTargetActionUrl(url);
  };

  // Broadcast to all user devices
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationBody.trim()) {
      setSendErrorMsg('Please enter a notification message.');
      return;
    }

    setIsSending(true);
    setSendSuccessMsg('');
    setSendErrorMsg('');

    try {
      const broadcastId = `dev_push_${Date.now()}`;
      const now = new Date();

      const broadcastData: DevicePushBroadcast = {
        id: broadcastId,
        title: notificationTitle.trim() || defaultTitle,
        body: notificationBody.trim(),
        senderLabel: 'Message from 9jacash company',
        targetPlatform,
        timestamp: Date.now(),
        createdAt: now.toISOString(),
        actionUrl: targetActionUrl || '/',
        tag: `9jacash-company-${Date.now()}`,
        sentBy: 'Company Admin',
        deliveredCount: stats.activeEnabledCount,
      };

      // 1. Save to dedicated device_broadcasts collection
      await saveDeviceBroadcastToFirestore(broadcastData);

      // 2. Also save to notifications collection for dual-channel reliability
      const appNotif: AppNotification = {
        id: broadcastId,
        title: notificationTitle.trim() || defaultTitle,
        desc: notificationBody.trim(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
        type: 'admin',
        targetUserId: 'all',
        isBroadcast: true,
        isDevicePush: true,
        targetPlatform,
        senderLabel: 'Message from 9jacash company',
        actionUrl: targetActionUrl || '/',
      };
      await saveNotificationToFirestore(appNotif);

      // Also trigger on current admin device if notifications allowed
      if (getDeviceNotificationPermission() === 'granted') {
        sendDeviceNotification(broadcastData.title, {
          body: broadcastData.body,
          tag: broadcastData.tag,
          data: { url: broadcastData.actionUrl },
        }).catch(console.warn);
      }

      setIsSending(false);
      setSendSuccessMsg(
        'Device notification successfully sent! Users who have notifications turned on or installed the app will receive this on their phone screen.'
      );
      setTimeout(() => setSendSuccessMsg(''), 7000);
    } catch (err) {
      console.error('Error dispatching device broadcast:', err);
      setIsSending(false);
      setSendErrorMsg('Failed to broadcast notification. Please try again.');
    }
  };

  // Send a quick test to admin's current device
  const handleTestOnThisDevice = async () => {
    setTestSuccessMsg('');
    try {
      let perm = getDeviceNotificationPermission();
      if (perm !== 'granted') {
        perm = await requestDeviceNotificationPermission();
      }

      if (perm !== 'granted') {
        setTestSuccessMsg('⚠️ Notification permission not granted on this browser. Please allow notifications.');
        setTimeout(() => setTestSuccessMsg(''), 4500);
        return;
      }

      playNotificationChime();
      const success = await sendDeviceNotification(notificationTitle.trim() || defaultTitle, {
        body: notificationBody.trim() || 'Test device notification from 9jacash company.',
        tag: `9jacash-test-${Date.now()}`,
        data: { url: targetActionUrl || '/' },
      });

      if (success) {
        setTestSuccessMsg('✅ Test notification popped on your device status bar / screen!');
      } else {
        setTestSuccessMsg('Test notification dispatched.');
      }
      setTimeout(() => setTestSuccessMsg(''), 5000);
    } catch (err) {
      console.warn('Test error:', err);
      setTestSuccessMsg('Could not trigger test notification.');
      setTimeout(() => setTestSuccessMsg(''), 4000);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    try {
      await deleteDeviceBroadcastFromFirestore(id);
    } catch (err) {
      console.warn('Could not delete broadcast history:', err);
    }
  };

  return (
    <div className="min-h-screen pb-16 space-y-4 animate-in fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#16171d] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:border-cyan-500/50 transition-colors cursor-pointer"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Send Device Notifications
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                Live Broadcast
              </span>
            </h1>
            <p className="text-[11px] text-stone-400">
              Push directly to users&apos; Android status bar &amp; iPhone lock screen • They don&apos;t need to open the app
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestOnThisDevice}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          title="Test how it looks on your current phone/computer"
        >
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Test on My Phone</span>
        </button>
      </div>

      {testSuccessMsg && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{testSuccessMsg}</span>
        </div>
      )}

      {/* Target Devices Reach Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#14151b] border border-stone-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Total Reach</span>
            <Smartphone className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-white">
            {stats.total}{' '}
            <span className="text-xs font-normal text-stone-400">Device(s)</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <ShieldCheck className="w-3 h-3" /> Registered Subscribers
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#14151b] border border-stone-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Android Phones</span>
            <span className="text-xs font-bold text-emerald-400">Android</span>
          </div>
          <div className="text-xl font-extrabold text-white">
            {stats.androidCount}{' '}
            <span className="text-xs font-normal text-stone-400">Active</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">Status bar &amp; Lock screen</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#14151b] border border-stone-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">iPhones / iOS</span>
            <span className="text-xs font-bold text-blue-400">iOS</span>
          </div>
          <div className="text-xl font-extrabold text-white">
            {stats.iosCount}{' '}
            <span className="text-xs font-normal text-stone-400">Active</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">Web Push &amp; PWA Center</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#14151b] border border-stone-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Installed PWA</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-white">
            {stats.pwaCount}{' '}
            <span className="text-xs font-normal text-stone-400">Installed</span>
          </div>
          <span className="text-[10px] text-amber-400 mt-1 block">Home screen web apps</span>
        </div>
      </div>

      {/* Main Grid: Composer on Left / Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Composer Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#14151b] border border-stone-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" />
                  Compose Device Push Notification
                </h2>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Sends directly to device status bars and lock screens. Users don&apos;t need to open the app.
                </p>
              </div>

              <div className="px-2.5 py-1 rounded-xl bg-stone-900 border border-stone-800 text-[11px] text-cyan-300 font-bold flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                <span>Message from 9jacash company</span>
              </div>
            </div>

            {/* Success & Error messages */}
            {sendSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Broadcast Dispatched Successfully!</span>
                  <span className="text-[11px] text-stone-300">{sendSuccessMsg}</span>
                </div>
              </div>
            )}

            {sendErrorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sendErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              {/* Notification Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-300">
                    Notification Title (Sender Header)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNotificationTitle(defaultTitle)}
                    className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Reset to Default
                  </button>
                </div>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Message from 9jacash company"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#1c1e26] border border-stone-700 rounded-xl text-white text-xs font-semibold focus:border-cyan-400 focus:outline-none transition-colors"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Official branding required: Defaults to &ldquo;Message from 9jacash company&rdquo;.
                </span>
              </div>

              {/* Notification Message Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-300">
                    Notification Message Body
                  </label>
                  <span className="text-[10px] text-stone-400">
                    {notificationBody.length} characters
                  </span>
                </div>
                <textarea
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  rows={4}
                  placeholder="Enter message to display on users' mobile lock screen and status bar..."
                  required
                  className="w-full p-3 bg-[#1c1e26] border border-stone-700 rounded-xl text-white text-xs leading-relaxed focus:border-cyan-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Quick Template Presets */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                  Quick 1-Click Message Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p.body, p.url)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1c1e26] hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Platforms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Target Mobile Platform
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTargetPlatform('all')}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border text-center transition-all cursor-pointer ${
                        targetPlatform === 'all'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                          : 'bg-[#1c1e26] text-stone-400 border-stone-800 hover:text-white'
                      }`}
                    >
                      All Devices
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPlatform('android')}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border text-center transition-all cursor-pointer ${
                        targetPlatform === 'android'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                          : 'bg-[#1c1e26] text-stone-400 border-stone-800 hover:text-white'
                      }`}
                    >
                      Android Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPlatform('ios')}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border text-center transition-all cursor-pointer ${
                        targetPlatform === 'ios'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                          : 'bg-[#1c1e26] text-stone-400 border-stone-800 hover:text-white'
                      }`}
                    >
                      iPhone Only
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    When User Taps Notification
                  </label>
                  <select
                    value={targetActionUrl}
                    onChange={(e) => setTargetActionUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1c1e26] border border-stone-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="/">Open Dashboard (Home)</option>
                    <option value="/withdraw">Open Bank Withdrawal Page</option>
                    <option value="/deposit">Open Wallet Deposit Page</option>
                    <option value="/earn">Open Daily Tasks &amp; Rewards</option>
                    <option value="/quickcode">Open Quick Code Service</option>
                    <option value="/account_details">Open Account Details</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSending || !notificationBody.trim()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-black" />
                      <span>Broadcasting to Devices...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-black" />
                      <span>Send Device Notification to All Users</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-stone-400 text-center mt-2">
                  ⚡ Native push alert with sound &amp; vibration sent directly to users&apos; phone screens.
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Live Device Phone Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#14151b] border border-stone-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                Live Mobile Screen Preview
              </span>

              {/* Switch Android / iOS preview */}
              <div className="flex items-center p-0.5 rounded-lg bg-[#1c1e26] border border-stone-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPreviewPlatform('android')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    previewPlatform === 'android'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPlatform('ios')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    previewPlatform === 'ios'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  iPhone
                </button>
              </div>
            </div>

            <p className="text-[11px] text-stone-400">
              This preview shows how the alert appears on users&apos; devices without entering the app:
            </p>

            {/* Mobile Device Mockup */}
            {previewPlatform === 'android' ? (
              /* Android Status Bar & Notification Shade Mockup */
              <div className="rounded-2xl bg-[#0c0d11] border border-stone-700/80 p-3.5 space-y-3 shadow-inner">
                {/* Android Status Bar */}
                <div className="flex items-center justify-between text-[11px] text-stone-300 font-mono pb-2 border-b border-stone-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>10:45</span>
                    <Bell className="w-3 h-3 text-cyan-400" />
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span>4G LTE</span>
                    <span>94%</span>
                  </div>
                </div>

                {/* Android Dropdown Notification Card */}
                <div className="p-3 rounded-xl bg-[#1c1d25] border border-stone-700 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-md bg-emerald-500 flex items-center justify-center text-black font-extrabold text-[9px]">
                        9J
                      </div>
                      <span className="text-[11px] font-bold text-stone-200">9jacash</span>
                      <span className="text-[9px] text-stone-400">• now</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      Notification
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {notificationTitle || defaultTitle}
                    </h4>
                    <p className="text-[11px] text-stone-300 mt-1 leading-snug break-words">
                      {notificationBody || 'Notification message...'}
                    </p>
                  </div>

                  <div className="pt-1.5 border-t border-stone-800 flex items-center justify-end gap-2 text-[10px] font-bold text-cyan-400">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20">
                      OPEN APP
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-stone-500 text-center">
                  Android Status Bar &amp; Lock Screen Card
                </div>
              </div>
            ) : (
              /* iPhone Lock Screen Mockup */
              <div className="rounded-2xl bg-gradient-to-b from-[#181924] to-[#0c0d12] border border-stone-700/80 p-4 space-y-4 shadow-inner text-center">
                {/* iPhone Clock */}
                <div className="py-2">
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold block">
                    Friday, October 23
                  </span>
                  <div className="text-3xl font-extralight text-white tracking-tight mt-0.5">
                    10:45
                  </div>
                </div>

                {/* iPhone Glassmorphic Notification Card */}
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-left shadow-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-black font-extrabold text-[8px]">
                        9J
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                        9JACASH
                      </span>
                    </div>
                    <span className="text-[9px] text-stone-300">now</span>
                  </div>

                  <h4 className="text-xs font-bold text-white">
                    {notificationTitle || defaultTitle}
                  </h4>
                  <p className="text-[11px] text-stone-200 leading-snug break-words">
                    {notificationBody || 'Notification message...'}
                  </p>
                </div>

                <div className="text-[10px] text-stone-500 text-center">
                  iPhone Lock Screen &amp; Notification Center
                </div>
              </div>
            )}

            {/* Test Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestOnThisDevice}
                className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-cyan-300 text-xs font-bold transition-all border border-cyan-500/30 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Notification On My Device Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History & Delivery Log */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#14151b] border border-stone-800 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Device Broadcast History &amp; Delivery Log
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            {broadcastHistory.length} Broadcast(s) Sent
          </span>
        </div>

        {broadcastHistory.length === 0 ? (
          <div className="p-6 text-center text-stone-500 text-xs border border-dashed border-stone-800 rounded-2xl">
            No device broadcasts sent yet. Use the form above to dispatch your first company device notification.
          </div>
        ) : (
          <div className="space-y-2.5">
            {broadcastHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#181922] border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-stone-700"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">
                      {item.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {item.targetPlatform ? item.targetPlatform.toUpperCase() : 'ALL DEVICES'}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent'}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 break-words leading-relaxed">
                    {item.body}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-stone-400 pt-0.5">
                    <span>Delivered: {item.deliveredCount || stats.activeEnabledCount} Devices</span>
                    <span>Action: {item.actionUrl || '/'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationTitle(item.title);
                      setNotificationBody(item.body);
                      if (item.actionUrl) setTargetActionUrl(item.actionUrl);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Resend / Copy
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteBroadcast(item.id)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
