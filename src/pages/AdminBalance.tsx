import { useState, useEffect } from 'react';
import { topUpBalanceByEmail, subscribeAllBalances } from '@/lib/store';
import Icon from '@/components/ui/icon';

interface UserBalance {
  uid: string;
  email: string;
  name: string;
  balance: number;
}

export default function AdminBalance() {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserBalance[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = subscribeAllBalances(setUsers);
    return () => unsub();
  }, []);

  async function handleTopUp() {
    if (!email.trim() || !amount.trim()) return;
    const amt = parseInt(amount);
    if (isNaN(amt) || amt <= 0) { setError('Введите корректную сумму'); return; }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await topUpBalanceByEmail(email.trim(), amt, note.trim());
      setSuccess(`Начислено ${amt.toLocaleString()} ₽ пользователю ${res.userName}`);
      setEmail('');
      setAmount('');
      setNote('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  const filtered = users.filter(u =>
    search === '' || u.email.toLowerCase().includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeInA 0.35s ease' }}>
      {/* Top-up form */}
      <div className="rounded-2xl p-5 mb-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Icon name="Wallet" size={18} color="white" />
          </div>
          <div>
            <div className="text-white font-bold">Начислить баланс</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Введите email и сумму</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Email пользователя</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Сумма (₽)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="500"
              min="1"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Комментарий (необязательно)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Бонус за покупку"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2">
            {[100, 500, 1000, 5000].map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: amount === String(a) ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                  color: amount === String(a) ? '#10b981' : 'rgba(255,255,255,0.5)',
                  border: amount === String(a) ? '1px solid rgba(16,185,129,0.4)' : '1px solid transparent'
                }}>
                +{a.toLocaleString()} ₽
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Icon name="AlertCircle" size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Icon name="CheckCircle" size={16} /> {success}
            </div>
          )}

          <button onClick={handleTopUp} disabled={loading || !email || !amount}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: loading || !email || !amount ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #10b981, #059669)',
              color: loading || !email || !amount ? 'rgba(255,255,255,0.3)' : 'white',
            }}>
            {loading ? 'Начисляем...' : 'Начислить баланс'}
          </button>
        </div>
      </div>

      {/* Users list */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-bold text-sm">Балансы пользователей</span>
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
              {users.length} чел.
            </span>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {users.length === 0 ? 'Нет зарегистрированных клиентов' : 'Ничего не найдено'}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {filtered.map(u => (
              <div key={u.uid} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{u.name}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{u.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm" style={{ color: u.balance > 0 ? '#10b981' : 'rgba(255,255,255,0.4)' }}>
                    {u.balance.toLocaleString()} ₽
                  </div>
                  <button onClick={() => setEmail(u.email)}
                    className="text-xs mt-0.5"
                    style={{ color: 'rgba(0,212,255,0.7)' }}>
                    Пополнить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
