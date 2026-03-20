import { useState } from 'react';
import ClientApp from './pages/ClientApp';
import AdminApp from './pages/AdminApp';

export default function App() {
  const [mode, setMode] = useState<'client' | 'admin' | null>(null);

  if (mode === 'client') return <ClientApp onExit={() => setMode(null)} />;
  if (mode === 'admin') return <AdminApp onExit={() => setMode(null)} />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #000B2E 0%, #001A6E 50%, #003099 100%)' }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)', animation: 'orb 4s ease-in-out infinite' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,91,255,0.15) 0%, transparent 70%)', animation: 'orb 6s ease-in-out infinite reverse' }} />
      </div>

      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

      <div className="relative z-10 text-center animate-fade-in px-6">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl font-black text-white"
              style={{ background: 'linear-gradient(135deg, #005BFF, #00D4FF)', boxShadow: '0 8px 32px rgba(0,91,255,0.5)' }}>
              O
            </div>
            <span className="text-6xl font-black text-white tracking-tighter">ZON</span>
          </div>
          <div className="text-xs font-semibold tracking-[0.35em] uppercase mt-2"
            style={{ color: '#00D4FF' }}>
            СИМУЛЯТОР МАРКЕТПЛЕЙСА
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-md mx-auto">
          <button
            onClick={() => setMode('client')}
            className="group relative overflow-hidden rounded-3xl p-7 text-left transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
              style={{ background: 'linear-gradient(135deg, rgba(0,91,255,0.25), rgba(0,212,255,0.08))' }} />
            <div className="relative z-10">
              <div className="text-4xl mb-4">🛍️</div>
              <div className="text-xl font-bold text-white mb-1">Покупатель</div>
              <div className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Каталог, корзина,<br />оформление заказа
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-3xl"
              style={{ background: 'linear-gradient(90deg, #005BFF, #00D4FF)' }} />
          </button>

          <button
            onClick={() => setMode('admin')}
            className="group relative overflow-hidden rounded-3xl p-7 text-left transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
              style={{ background: 'linear-gradient(135deg, rgba(255,63,63,0.2), rgba(255,140,0,0.08))' }} />
            <div className="relative z-10">
              <div className="text-4xl mb-4">⚙️</div>
              <div className="text-xl font-bold text-white mb-1">Администратор</div>
              <div className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Управление заказами<br />и статусами
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-3xl"
              style={{ background: 'linear-gradient(90deg, #FF3F3F, #FF8C00)' }} />
          </button>
        </div>

        <p className="mt-10 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Firebase Realtime · Live sync · QR-коды
        </p>
      </div>

      <style>{`
        @keyframes orb {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.08) translateY(-20px); }
        }
        .animate-fade-in { animation: fadeInUp 0.7s ease forwards; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
