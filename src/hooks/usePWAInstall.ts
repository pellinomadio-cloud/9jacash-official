import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
    __pwaIsInstalled?: boolean;
  }
}

// Capture at module load time as well in case event fires before component mounts
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    window.__deferredPwaPrompt = e as BeforeInstallPromptEvent;
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPwaPrompt) {
      return window.__deferredPwaPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      Boolean(window.__pwaIsInstalled) ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    const isStandalone =
      Boolean(window.__pwaIsInstalled) ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const android = /android/.test(ua);
    const inApp = /wv|fban|fbav|instagram|telegram|whatsapp|micromessenger|line\/|tiktok/.test(ua);

    setIsIOS(ios);
    setIsAndroid(android);
    setIsInAppBrowser(inApp);

    if (window.__deferredPwaPrompt) {
      setDeferredPrompt(window.__deferredPwaPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleCustomInstallAvailable = () => {
      if (window.__deferredPwaPrompt) {
        setDeferredPrompt(window.__deferredPwaPrompt);
      }
    };

    const handleAppInstalled = () => {
      window.__pwaIsInstalled = true;
      window.__deferredPwaPrompt = null;
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', handleCustomInstallAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-app-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-available', handleCustomInstallAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-app-installed', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    let promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPwaPrompt : null);

    // If the user clicked right as the dashboard mounted, wait briefly in case beforeinstallprompt is just firing
    if (!promptEvent && typeof window !== 'undefined') {
      await new Promise((resolve) => setTimeout(resolve, 250));
      promptEvent = window.__deferredPwaPrompt || null;
    }

    if (!promptEvent) {
      return 'unavailable';
    }

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        window.__pwaIsInstalled = true;
        window.__deferredPwaPrompt = null;
        setIsInstalled(true);
        setDeferredPrompt(null);
        return 'accepted';
      }
      return 'dismissed';
    } catch {
      return 'unavailable';
    }
  }, [deferredPrompt]);

  const openInAndroidChrome = useCallback(() => {
    if (typeof window === 'undefined') return;
    const currentUrl = window.location.href.replace(/^https?:\/\//i, '');
    const scheme = window.location.protocol === 'https:' ? 'https' : 'http';
    const intentUrl = `intent://${currentUrl}#Intent;scheme=${scheme};package=com.android.chrome;end`;
    window.location.href = intentUrl;
  }, []);

  return {
    isInstallable: Boolean(deferredPrompt || (typeof window !== 'undefined' && window.__deferredPwaPrompt)),
    isInstalled,
    isIOS,
    isAndroid,
    isInAppBrowser,
    install,
    openInAndroidChrome,
  };
}
