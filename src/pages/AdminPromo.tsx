import { useState, useEffect } from 'react';
import { PromoCode, PromoType, subscribePromoCodes, createPromoCode, updatePromoCode, deletePromoCode } from '@/lib/store';
import Icon from '@/components/ui/icon';

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function AdminPromo() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [type, setType] = useState<PromoType>('percent');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('100');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    const unsub = subscribePromoCodes(setPromos);
    return () => unsub();
  }, []);

  function resetForm() {
    setCode('');
    setType('percent');
    setValue('');
    setMaxUses('100');
    setExpiresAt('');
    setShowForm(false);
  }

  async function handleCreate() {
    if (!code.trim() || !value.trim()) return;
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return;
    setSaving(true);
    await createPromoCode({
      code: code.trim().toUpperCase(),
      type,
      value: v,
      maxUses: parseInt(maxUses) || 100,
      active: true,
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
    });
    resetForm();
    setSaving(false);
  }

  async function toggleActive(promo: PromoCode) {
    await updatePromoCode(promo.id, { active: !promo.active });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deletePromoCode(id);
    setDeletingId(null);
  }

  function promoLabel(promo: PromoCode) {
    return promo.type === 'percent' ? `${promo.value}%` : `${promo.value.toLocaleString()} ₽`;
  }

  return (
    <div style={{ animation: 'fadeInA 0.35s ease' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-white font-bold">Промокоды</div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{promos.length} создано</div>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: showForm ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #a855f7, #7c3aed)', color: 'white' }}>
          <Icon name={showForm ? 'X' : 'Plus'} size={16} />
          {showForm ? 'Отмена' : 'Создать'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-5"
          style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)' }}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Код</label>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="SUMMER24"
                  className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none font-mono"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button onClick={() => setCode(randomCode())}
                  className="px-3 rounded-xl text-xs"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
                  title="Сгенерировать">
                  <Icon name="Shuffle" size={14} />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Тип скидки</label>
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={() => setType('percent')}
                  className="flex-1 py-2.5 text-xs font-bold transition-all"
                  style={{ background: type === 'percent' ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.05)', color: type === 'percent' ? '#a855f7' : 'rgba(255,255,255,0.4)' }}>
                  %
                </button>
                <button onClick={() => setType('fixed')}
                  className="flex-1 py-2.5 text-xs font-bold transition-all"
                  style={{ background: type === 'fixed' ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.05)', color: type === 'fixed' ? '#a855f7' : 'rgba(255,255,255,0.4)' }}>
                  ₽
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {type === 'percent' ? 'Процент скидки' : 'Сумма скидки (₽)'}
              </label>
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={type === 'percent' ? '10' : '500'}
                min="1"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Макс. использований</label>
              <input
                type="number"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                min="1"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Срок действия (необязательно)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
            />
          </div>
          <button onClick={handleCreate} disabled={saving || !code || !value}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: saving || !code || !value ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #a855f7, #7c3aed)',
              color: saving || !code || !value ? 'rgba(255,255,255,0.3)' : 'white',
            }}>
            {saving ? 'Создаём...' : 'Создать промокод'}
          </button>
        </div>
      )}

      {/* Promos list */}
      {promos.length === 0 ? (
        <div className="text-center py-12 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-3xl mb-3">🎟️</div>
          <div className="text-white font-semibold mb-1">Промокодов пока нет</div>
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Создайте первый промокод для скидки</div>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map(p => {
            const expired = p.expiresAt ? p.expiresAt < Date.now() : false;
            const exhausted = p.usedCount >= p.maxUses;
            const statusColor = !p.active || expired || exhausted ? 'rgba(255,255,255,0.25)' : '#a855f7';
            const statusBg = !p.active || expired || exhausted ? 'rgba(255,255,255,0.04)' : 'rgba(168,85,247,0.07)';
            const statusBorder = !p.active || expired || exhausted ? 'rgba(255,255,255,0.07)' : 'rgba(168,85,247,0.2)';

            return (
              <div key={p.id} className="rounded-2xl p-4"
                style={{ background: statusBg, border: `1px solid ${statusBorder}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-lg tracking-wider"
                      style={{ color: statusColor }}>{p.code}</span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black"
                      style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>
                      −{promoLabel(p)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(p)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                      style={{ background: p.active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)' }}
                      title={p.active ? 'Деактивировать' : 'Активировать'}>
                      <Icon name={p.active ? 'ToggleRight' : 'ToggleLeft'} size={18}
                        color={p.active ? '#10b981' : 'rgba(255,255,255,0.3)'} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                      style={{ background: 'rgba(239,68,68,0.1)' }}>
                      <Icon name={deletingId === p.id ? 'Loader' : 'Trash2'} size={16} color="#ef4444" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <span>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{p.usedCount}</span> / {p.maxUses} использ.
                  </span>
                  {p.expiresAt && (
                    <span style={{ color: expired ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
                      До {new Date(p.expiresAt).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                  {exhausted && <span style={{ color: '#f59e0b' }}>Исчерпан</span>}
                  {expired && !exhausted && <span style={{ color: '#ef4444' }}>Истёк</span>}
                  {!p.active && !expired && !exhausted && <span style={{ color: 'rgba(255,255,255,0.3)' }}>Отключён</span>}
                  {p.active && !expired && !exhausted && <span style={{ color: '#10b981' }}>Активен</span>}
                </div>

                {/* Usage bar */}
                <div className="mt-2 rounded-full overflow-hidden h-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (p.usedCount / p.maxUses) * 100)}%`,
                      background: exhausted ? '#ef4444' : 'linear-gradient(90deg, #a855f7, #7c3aed)',
                    }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
