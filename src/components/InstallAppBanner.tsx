import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    if (isIOSDevice) {
      setIsIOS(true);
      setTimeout(() => setShow(true), 3000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSHint(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!show) return null;

  return (
    <>
      <div
        className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300"
        style={{
          background: 'linear-gradient(135deg, #005BFF, #0037CC)',
          boxShadow: '0 8px 32px rgba(0,91,255,0.45)',
        }}
      >
        <img
          src="https://cdn.poehali.dev/projects/184b8c2e-3be3-4606-824e-44ea3848f7a1/files/53d0c2e3-62bb-4f32-b808-3ed99b04129c.jpg"
          className="w-12 h-12 rounded-xl flex-shrink-0"
          alt="OZON"
        />
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm">Установить приложение</div>
          <div className="text-blue-200 text-xs">Работает без интернета, быстрее</div>
        </div>
        <button
          onClick={handleInstall}
          className="px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
        >
          {isIOS ? 'Как?' : 'Установить'}
        </button>
        <button onClick={handleDismiss} className="text-blue-200 flex-shrink-0 p-1">
          <Icon name="X" size={16} />
        </button>
      </div>

      {showIOSHint && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowIOSHint(false)}
        >
          <div
            className="w-full rounded-3xl p-6 mb-4"
            style={{ background: 'white' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-lg font-black text-gray-900 mb-1">Как установить на iPhone</div>
              <div className="text-sm text-gray-500">3 простых шага</div>
            </div>
            <div className="space-y-3">
              {[
                { icon: 'Share', text: 'Нажми кнопку «Поделиться» внизу браузера' },
                { icon: 'Plus', text: 'Выбери «На экран "Домой"»' },
                { icon: 'Check', text: 'Нажми «Добавить» — готово!' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F0F4FF' }}>
                    <Icon name={step.icon as "Share" | "Plus" | "Check"} size={18} style={{ color: '#005BFF' }} />
                  </div>
                  <div className="text-sm text-gray-700 font-medium">{step.text}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setShowIOSHint(false); setShow(false); localStorage.setItem('pwa-install-dismissed', '1'); }}
              className="w-full mt-5 py-3 rounded-2xl text-white font-bold"
              style={{ background: 'linear-gradient(135deg, #005BFF, #0037CC)' }}
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
}
