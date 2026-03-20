import { useState } from 'react';
import { registerUser, loginUser, loginAdmin, UserProfile } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface Props {
  mode: 'client' | 'admin';
  onSuccess: (profile: UserProfile) => void;
  onBack: () => void;
}

export default function AuthScreen({ mode, onSuccess, onBack }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>(mode === 'admin' ? 'login' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const isAdmin = mode === 'admin';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let profile: UserProfile;
      if (isAdmin) {
        profile = await loginAdmin(email, password);
      } else if (tab === 'register') {
        if (!name.trim()) { setError('Введите имя'); setLoading(false); return; }
        profile = await registerUser(email, password, name.trim());
      } else {
        profile = await loginUser(email, password);
      }
      onSuccess(profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('user-not-found') || msg.includes('invalid-credential') || msg.includes('INVALID_LOGIN_CREDENTIALS')) {
        setError('Неверный email или пароль');
      } else if (msg.includes('email-already-in-use')) {
        setError('Этот email уже зарегистрирован');
      } else if (msg.includes('weak-password')) {
        setError('Пароль должен быть минимум 6 символов');
      } else if (msg.includes('invalid-email')) {
        setError('Некорректный email');
      } else if (msg.includes('network')) {
        setError('Ошибка сети. Проверьте подключение');
      } else {
        setError('Ошибка: ' + msg.slice(0, 80));
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: isAdmin ? 'linear-gradient(135deg, #080D1A 0%, #0F1A3A 100%)' : 'linear-gradient(135deg, #000B2E 0%, #001A6E 100%)' }}>

      {/* BG orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: `radial-gradient(circle, ${isAdmin ? 'rgba(255,63,63,0.12)' : 'rgba(0,212,255,0.15)'} 0%, transparent 70%)`, animation: 'orbA 5s ease-in-out infinite' }} />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full"
          style={{ background: `radial-gradient(circle, ${isAdmin ? 'rgba(255,140,0,0.08)' : 'rgba(0,91,255,0.12)'} 0%, transparent 70%)`, animation: 'orbA 7s ease-in-out infinite reverse' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm" style={{ animation: 'authIn 0.5s ease' }}>

        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          <Icon name="ChevronLeft" size={18} />
          Назад
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
              style={{ background: isAdmin ? 'linear-gradient(135deg, #FF3F3F, #FF8C00)' : 'linear-gradient(135deg, #005BFF, #00D4FF)', boxShadow: isAdmin ? '0 6px 24px rgba(255,63,63,0.4)' : '0 6px 24px rgba(0,91,255,0.4)' }}>
              {isAdmin ? 'A' : 'O'}
            </div>
            <span className="text-3xl font-black text-white">{isAdmin ? 'Администратор' : 'ZON'}</span>
          </div>
          {!isAdmin && (
            <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#00D4FF' }}>
              МАРКЕТПЛЕЙС
            </div>
          )}
        </div>

        {/* Tab switcher — only for clients */}
        {!isAdmin && (
          <div className="flex p-1 rounded-2xl mb-6" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <button onClick={() => setTab('login')}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: tab === 'login' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: tab === 'login' ? 'white' : 'rgba(255,255,255,0.4)'
              }}>
              Войти
            </button>
            <button onClick={() => setTab('register')}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: tab === 'register' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: tab === 'register' ? 'white' : 'rgba(255,255,255,0.4)'
              }}>
              Регистрация
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isAdmin && tab === 'register' && (
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Имя</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Иван Петров"
                className="w-full px-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = '#005BFF'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder={isAdmin ? 'admin@ozon.ru' : 'you@email.com'}
              className="w-full px-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.1)' }}
              onFocus={e => e.target.style.borderColor = isAdmin ? '#FF3F3F' : '#005BFF'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Пароль</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full px-4 py-3.5 pr-12 rounded-2xl text-sm text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = isAdmin ? '#FF3F3F' : '#005BFF'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,63,63,0.15)', border: '1px solid rgba(255,63,63,0.3)' }}>
              <Icon name="AlertCircle" size={14} style={{ color: '#FF6B6B' }} />
              <span className="text-sm" style={{ color: '#FF6B6B' }}>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm transition-all active:scale-98 mt-2"
            style={{
              background: loading ? 'rgba(255,255,255,0.1)' : isAdmin ? 'linear-gradient(135deg, #FF3F3F, #FF8C00)' : 'linear-gradient(135deg, #005BFF, #0037CC)',
              boxShadow: loading ? 'none' : isAdmin ? '0 8px 24px rgba(255,63,63,0.35)' : '0 8px 24px rgba(0,91,255,0.35)',
              color: loading ? 'rgba(255,255,255,0.4)' : 'white',
            }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                Загрузка...
              </span>
            ) : isAdmin ? 'Войти в панель' : tab === 'register' ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>

        {/* Hint */}
        <div className="mt-6 text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {isAdmin ? 'Доступ только для сотрудников ПВЗ' : 'Заказы сохраняются в вашем аккаунте'}
        </div>
      </div>

      <style>{`
        @keyframes orbA { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.1) translateY(-15px)} }
        @keyframes authIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
