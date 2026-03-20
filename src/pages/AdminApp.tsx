import { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, STATUS_LABELS, STATUS_COLORS, subscribeOrders, updateOrderStatus } from '@/lib/store';
import Icon from '@/components/ui/icon';
import { Html5Qrcode } from 'html5-qrcode';
import { get, ref } from 'firebase/database';
import { db } from '@/lib/firebase';
import { logoutUser } from '@/lib/auth';

interface Props { onExit: () => void; }

const ALL_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'ready', 'delivered', 'cancelled'];

const STATUS_ICONS: Record<OrderStatus, string> = {
  pending: '⏳',
  processing: '🔄',
  shipped: '🚚',
  ready: '✅',
  delivered: '🎉',
  cancelled: '❌',
};

type AdminTab = 'orders' | 'scanner';

export default function AdminApp({ onExit }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>('orders');
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const SCANNER_DIV = 'qr-reader-admin';

  useEffect(() => {
    const unsub = subscribeOrders((all) => {
      setOrders(all);
      setSelectedOrder(prev => prev ? (all.find(o => o.id === prev.id) ?? prev) : null);
      setScannedOrder(prev => prev ? (all.find(o => o.id === prev.id) ?? prev) : null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (tab === 'scanner') {
      const t = setTimeout(() => startScanner(), 300);
      return () => { clearTimeout(t); stopScanner(); };
    } else {
      stopScanner();
      return undefined;
    }
  }, [tab]);

  async function startScanner() {
    setScanError(null);
    setScanning(true);
    try {
      const scanner = new Html5Qrcode(SCANNER_DIV);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          await stopScanner();
          await handleQRResult(decoded);
        },
        () => {}
      );
    } catch {
      setScanning(false);
      setScanError('Нет доступа к камере. Разрешите доступ в браузере.');
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch (_) { /* ignore stop errors */ }
    scannerRef.current = null;
    setScanning(false);
  }

  async function handleQRResult(text: string) {
    const match = text.match(/^OZON-ORDER-(.+)$/);
    if (!match) { setScanError(`Неверный QR: ${text}`); return; }
    const snap = await get(ref(db, `orders/${match[1]}`));
    if (!snap.exists()) { setScanError(`Заказ не найден`); return; }
    setScannedOrder(snap.val() as Order);
  }

  async function changeStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId);
    await updateOrderStatus(orderId, status);
    setUpdating(null);
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const counts = ALL_STATUSES.reduce((acc, s) => ({ ...acc, [s]: orders.filter(o => o.status === s).length }), {} as Record<OrderStatus, number>);

  return (
    <div className="min-h-screen pb-6" style={{ background: '#080D1A' }}>
      {/* Header */}
      <header className="sticky top-0 z-40"
        style={{ background: 'rgba(8,13,26,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,212,255,0.12)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={async () => { await logoutUser(); onExit(); }} style={{ color: 'rgba(255,255,255,0.45)' }}>
            <Icon name="LogOut" size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black"
              style={{ background: 'linear-gradient(135deg, #FF3F3F, #FF8C00)', color: 'white' }}>A</div>
            <span className="text-lg font-black text-white">Админ</span>
            <span className="text-xs ml-1" style={{ color: '#00D4FF' }}>OZON ПВЗ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#00C853', animation: 'glow 2s infinite' }} />
            <span className="text-xs font-semibold" style={{ color: '#00C853' }}>Live · {orders.length}</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-5 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <button onClick={() => setTab('orders')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: tab === 'orders' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: tab === 'orders' ? 'white' : 'rgba(255,255,255,0.4)'
            }}>
            <Icon name="Package" size={16} /> Заказы
          </button>
          <button onClick={() => setTab('scanner')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: tab === 'scanner' ? 'rgba(0,212,255,0.15)' : 'transparent',
              color: tab === 'scanner' ? '#00D4FF' : 'rgba(255,255,255,0.4)',
              border: tab === 'scanner' ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent'
            }}>
            <Icon name="Scan" size={16} /> Сканер QR
          </button>
        </div>

        {/* ─── SCANNER TAB ─── */}
        {tab === 'scanner' && (
          <div style={{ animation: 'fadeInA 0.35s ease' }}>
            {!scannedOrder ? (
              <div className="text-center">
                <div className="text-white font-bold text-lg mb-1">QR-сканер выдачи</div>
                <div className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Наведите камеру на QR покупателя
                </div>

                <div className="relative mx-auto rounded-3xl overflow-hidden mb-5"
                  style={{ maxWidth: '320px', background: '#000', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 50px rgba(0,212,255,0.12)' }}>
                  <div id={SCANNER_DIV} style={{ width: '100%' }} />
                  {/* Frame corners */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[['top-3 left-3', 'border-t-2 border-l-2 rounded-tl-lg'],
                      ['top-3 right-3', 'border-t-2 border-r-2 rounded-tr-lg'],
                      ['bottom-3 left-3', 'border-b-2 border-l-2 rounded-bl-lg'],
                      ['bottom-3 right-3', 'border-b-2 border-r-2 rounded-br-lg']
                    ].map(([pos, cls], i) => (
                      <div key={i} className={`absolute w-7 h-7 ${pos} ${cls}`} style={{ borderColor: '#00D4FF' }} />
                    ))}
                    <div className="absolute left-8 right-8 h-0.5"
                      style={{ top: '50%', background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)', animation: 'scanLine 2s ease-in-out infinite' }} />
                  </div>
                </div>

                {scanError && (
                  <div className="max-w-xs mx-auto p-4 rounded-2xl mb-4"
                    style={{ background: 'rgba(255,63,63,0.15)', border: '1px solid rgba(255,63,63,0.3)' }}>
                    <div className="text-sm font-semibold mb-3" style={{ color: '#FF6B6B' }}>{scanError}</div>
                    <button onClick={startScanner}
                      className="w-full py-2 rounded-xl text-sm font-bold text-white"
                      style={{ background: 'rgba(255,63,63,0.35)' }}>
                      Попробовать снова
                    </button>
                  </div>
                )}

                {!scanning && !scanError && (
                  <button onClick={startScanner}
                    className="px-6 py-3 rounded-2xl text-white font-bold transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #005BFF, #00D4FF)', boxShadow: '0 8px 24px rgba(0,91,255,0.4)' }}>
                    <Icon name="Camera" size={16} className="inline mr-2" />
                    Запустить камеру
                  </button>
                )}
              </div>
            ) : (
              /* Scanned order result */
              <div style={{ animation: 'scaleInA 0.3s ease' }}>
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => { setScannedOrder(null); startScanner(); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                    <Icon name="Scan" size={15} /> Новый скан
                  </button>
                  <span className="text-sm font-bold" style={{ color: '#00C853' }}>✅ Заказ найден!</span>
                </div>

                {/* Status + meta */}
                <div className="rounded-2xl p-5 mb-4"
                  style={{ background: STATUS_COLORS[scannedOrder.status] + '12', border: `1.5px solid ${STATUS_COLORS[scannedOrder.status]}50` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{STATUS_ICONS[scannedOrder.status]}</span>
                      <div>
                        <div className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Статус</div>
                        <div className="font-black" style={{ color: STATUS_COLORS[scannedOrder.status] }}>
                          {STATUS_LABELS[scannedOrder.status]}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black" style={{ color: '#00D4FF' }}>{scannedOrder.total.toLocaleString()} ₽</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>#{scannedOrder.id?.slice(-8).toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="text-sm text-white font-semibold">{scannedOrder.userName}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{new Date(scannedOrder.createdAt).toLocaleString('ru')}</div>
                </div>

                {/* Change status */}
                <div className="rounded-2xl p-5 mb-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-sm font-bold text-white mb-3">Изменить статус</div>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_STATUSES.map(status => (
                      <button key={status}
                        onClick={() => changeStatus(scannedOrder.id!, status)}
                        disabled={scannedOrder.status === status || !!updating}
                        className="flex items-center gap-2 p-3 rounded-xl text-left transition-all active:scale-95"
                        style={{
                          background: scannedOrder.status === status ? STATUS_COLORS[status] + '30' : 'rgba(255,255,255,0.06)',
                          border: `1.5px solid ${scannedOrder.status === status ? STATUS_COLORS[status] : 'rgba(255,255,255,0.08)'}`,
                          opacity: updating && scannedOrder.status !== status ? 0.5 : 1,
                        }}>
                        <span>{STATUS_ICONS[status]}</span>
                        <span className="text-xs font-semibold"
                          style={{ color: scannedOrder.status === status ? STATUS_COLORS[status] : 'rgba(255,255,255,0.7)' }}>
                          {STATUS_LABELS[status]}
                        </span>
                        {scannedOrder.status === status && <Icon name="Check" size={12} className="ml-auto" style={{ color: STATUS_COLORS[status] }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div className="rounded-2xl p-5 mb-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-sm font-bold text-white mb-3">
                    Состав заказа · {scannedOrder.items.reduce((s, i) => s + i.quantity, 0)} товара
                  </div>
                  <div className="space-y-3">
                    {scannedOrder.items.map(item => (
                      <div key={item.product.id} className="flex gap-3 items-center">
                        <img src={item.product.image} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white line-clamp-1">{item.product.name}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {item.quantity} шт × {item.product.price.toLocaleString()} ₽
                          </div>
                        </div>
                        <div className="text-sm font-bold shrink-0" style={{ color: '#00D4FF' }}>
                          {(item.product.price * item.quantity).toLocaleString()} ₽
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-4 pt-4 flex justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span className="text-white font-bold">Итого</span>
                    <span className="text-xl font-black" style={{ color: '#00D4FF' }}>{scannedOrder.total.toLocaleString()} ₽</span>
                  </div>
                </div>

                {/* Address */}
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex gap-2 items-center mb-1">
                    <Icon name="MapPin" size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {scannedOrder.address.street}, {scannedOrder.address.city}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Icon name="CreditCard" size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {scannedOrder.payment.label}{scannedOrder.payment.last4 ? ` •••• ${scannedOrder.payment.last4}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── ORDERS TAB ─── */}
        {tab === 'orders' && !selectedOrder && (
          <div style={{ animation: 'fadeInA 0.35s ease' }}>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-2xl font-black text-white">{orders.length}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Всего</div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.2)' }}>
                <div className="text-2xl font-black" style={{ color: '#00C853' }}>{counts.ready || 0}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(0,200,83,0.6)' }}>К выдаче</div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="text-2xl font-black" style={{ color: '#F59E0B' }}>{counts.pending || 0}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(245,158,11,0.6)' }}>Ожидают</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 pb-1">
              <button onClick={() => setFilter('all')}
                className="whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-semibold shrink-0"
                style={{
                  background: filter === 'all' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  color: filter === 'all' ? 'white' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${filter === 'all' ? 'rgba(255,255,255,0.2)' : 'transparent'}`
                }}>
                Все ({orders.length})
              </button>
              {ALL_STATUSES.map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className="whitespace-nowrap px-3 py-2 rounded-2xl text-sm font-semibold shrink-0"
                  style={{
                    background: filter === s ? STATUS_COLORS[s] + '25' : 'rgba(255,255,255,0.04)',
                    color: filter === s ? STATUS_COLORS[s] : 'rgba(255,255,255,0.35)',
                    border: `1px solid ${filter === s ? STATUS_COLORS[s] + '50' : 'transparent'}`
                  }}>
                  {STATUS_ICONS[s]} {STATUS_LABELS[s]} ({counts[s] || 0})
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-3">📭</div>
                <div style={{ color: 'rgba(255,255,255,0.3)' }}>Заказов нет</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(order => (
                  <button key={order.id} onClick={() => setSelectedOrder(order)}
                    className="w-full rounded-2xl p-4 text-left transition-all hover:scale-[1.01]"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${order.status === 'ready' ? 'rgba(0,200,83,0.35)' : 'rgba(255,255,255,0.07)'}`,
                      boxShadow: order.status === 'ready' ? '0 0 20px rgba(0,200,83,0.1)' : 'none'
                    }}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-white font-bold">#{order.id?.slice(-6)}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {order.userName} · {new Date(order.createdAt).toLocaleString('ru')}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                        style={{ background: STATUS_COLORS[order.status] + '20', color: STATUS_COLORS[order.status] }}>
                        {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.items.slice(0, 4).map(item => (
                        <img key={item.product.id} src={item.product.image} className="w-9 h-9 rounded-lg object-cover" />
                      ))}
                      <span className="ml-auto font-black text-base" style={{ color: '#00D4FF' }}>
                        {order.total.toLocaleString()} ₽
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order detail in orders tab */}
        {tab === 'orders' && selectedOrder && (
          <div style={{ animation: 'scaleInA 0.3s ease' }}>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setSelectedOrder(null)}>
                <Icon name="ChevronLeft" size={24} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
              <h2 className="text-xl font-black text-white">Заказ #{selectedOrder.id?.slice(-6)}</h2>
            </div>

            <div className="rounded-2xl p-5 mb-4"
              style={{ background: STATUS_COLORS[selectedOrder.status] + '12', border: `1.5px solid ${STATUS_COLORS[selectedOrder.status]}40` }}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{STATUS_ICONS[selectedOrder.status]}</span>
                <div>
                  <div className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Текущий статус</div>
                  <div className="text-lg font-black" style={{ color: STATUS_COLORS[selectedOrder.status] }}>
                    {STATUS_LABELS[selectedOrder.status]}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5 mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-sm font-bold text-white mb-3">Изменить статус</div>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STATUSES.map(status => (
                  <button key={status}
                    onClick={() => changeStatus(selectedOrder.id!, status)}
                    disabled={selectedOrder.status === status || !!updating}
                    className="flex items-center gap-2 p-3 rounded-xl text-left transition-all active:scale-95"
                    style={{
                      background: selectedOrder.status === status ? STATUS_COLORS[status] + '30' : 'rgba(255,255,255,0.06)',
                      border: `1.5px solid ${selectedOrder.status === status ? STATUS_COLORS[status] : 'rgba(255,255,255,0.08)'}`,
                      opacity: updating && selectedOrder.status !== status ? 0.5 : 1,
                    }}>
                    <span>{STATUS_ICONS[status]}</span>
                    <span className="text-xs font-semibold"
                      style={{ color: selectedOrder.status === status ? STATUS_COLORS[status] : 'rgba(255,255,255,0.7)' }}>
                      {STATUS_LABELS[status]}
                    </span>
                    {selectedOrder.status === status && <Icon name="Check" size={12} className="ml-auto" style={{ color: STATUS_COLORS[status] }} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5 mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-sm font-bold text-white mb-3">Состав заказа</div>
              <div className="space-y-3">
                {selectedOrder.items.map(item => (
                  <div key={item.product.id} className="flex gap-3 items-center">
                    <img src={item.product.image} className="w-11 h-11 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white line-clamp-1">{item.product.name}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.quantity} шт</div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: '#00D4FF' }}>
                      {(item.product.price * item.quantity).toLocaleString()} ₽
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4 flex justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <span className="text-white font-bold">Итого</span>
                <span className="text-xl font-black" style={{ color: '#00D4FF' }}>{selectedOrder.total.toLocaleString()} ₽</span>
              </div>
            </div>

            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex gap-2 mb-1">
                <Icon name="User" size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="text-xs font-semibold text-white">{selectedOrder.userName}</span>
              </div>
              <div className="flex gap-2">
                <Icon name="MapPin" size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {selectedOrder.address.street}, {selectedOrder.address.city}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-80px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(80px); opacity: 0; }
        }
        @keyframes glow { 0%,100%{box-shadow:0 0 4px #00C853;} 50%{box-shadow:0 0 10px #00C853;} }
        @keyframes fadeInA { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleInA { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        #${SCANNER_DIV} { border: none !important; }
        #${SCANNER_DIV} video { border-radius: 0 !important; }
        #${SCANNER_DIV} img { display: none !important; }
      `}</style>
    </div>
  );
}