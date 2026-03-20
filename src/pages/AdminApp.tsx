import { useState, useEffect } from 'react';
import { Order, OrderStatus, STATUS_LABELS, STATUS_COLORS, subscribeOrders, updateOrderStatus } from '@/lib/store';
import Icon from '@/components/ui/icon';
import { QRCodeSVG } from 'qrcode.react';

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

export default function AdminApp({ onExit }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const unsub = subscribeOrders((all) => {
      setOrders(all);
      if (selectedOrder) {
        const updated = all.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    });
    return () => unsub();
  }, [selectedOrder?.id]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  async function changeStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId);
    await updateOrderStatus(orderId, status);
    setUpdating(null);
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0F1E' }}>
      {/* Header */}
      <header className="sticky top-0 z-40"
        style={{ background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onExit} className="transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <Icon name="ChevronLeft" size={24} />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black"
                style={{ background: 'linear-gradient(135deg, #FF3F3F, #FF8C00)', color: 'white' }}>A</div>
              <div>
                <span className="text-lg font-black text-white">Админ-панель</span>
                <span className="text-xs ml-2" style={{ color: '#00D4FF' }}>OZON</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00C853' }} />
              <span className="text-xs" style={{ color: '#00C853' }}>Live</span>
              <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{orders.length} заказов</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {!selectedOrder ? (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-2xl font-black text-white">{orders.length}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Всего заказов</div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.2)' }}>
                <div className="text-2xl font-black" style={{ color: '#00C853' }}>{counts.ready || 0}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(0,200,83,0.7)' }}>К выдаче</div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="text-2xl font-black" style={{ color: '#F59E0B' }}>{counts.pending || 0}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(245,158,11,0.7)' }}>Ожидают</div>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 py-1">
              <button
                onClick={() => setFilter('all')}
                className="whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-semibold transition-all shrink-0"
                style={{
                  background: filter === 'all' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  color: filter === 'all' ? 'white' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${filter === 'all' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`
                }}>
                Все ({orders.length})
              </button>
              {ALL_STATUSES.map(s => (
                <button key={s}
                  onClick={() => setFilter(s)}
                  className="whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-semibold transition-all shrink-0"
                  style={{
                    background: filter === s ? STATUS_COLORS[s] + '25' : 'rgba(255,255,255,0.04)',
                    color: filter === s ? STATUS_COLORS[s] : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${filter === s ? STATUS_COLORS[s] + '50' : 'rgba(255,255,255,0.06)'}`
                  }}>
                  {STATUS_ICONS[s]} {STATUS_LABELS[s]} ({counts[s] || 0})
                </button>
              ))}
            </div>

            {/* Orders list */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">📭</div>
                <div style={{ color: 'rgba(255,255,255,0.4)' }}>Заказов нет</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(order => (
                  <button key={order.id} onClick={() => setSelectedOrder(order)}
                    className="w-full rounded-2xl p-4 text-left transition-all hover:scale-[1.01]"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${order.status === 'ready' ? 'rgba(0,200,83,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: order.status === 'ready' ? '0 0 20px rgba(0,200,83,0.1)' : 'none'
                    }}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-white font-bold">#{order.id?.slice(-6)}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {order.userName} · {new Date(order.createdAt).toLocaleString('ru')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: STATUS_COLORS[order.status], fontSize: '18px' }}>{STATUS_ICONS[order.status]}</span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                          style={{ background: STATUS_COLORS[order.status] + '20', color: STATUS_COLORS[order.status] }}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {order.items.slice(0, 4).map(item => (
                          <img key={item.product.id} src={item.product.image}
                            className="w-9 h-9 rounded-lg object-cover" />
                        ))}
                      </div>
                      <div className="ml-auto">
                        <div className="text-right">
                          <div className="font-black text-base" style={{ color: '#00D4FF' }}>
                            {order.total.toLocaleString()} ₽
                          </div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {order.items.reduce((s, i) => s + i.quantity, 0)} товара
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Order detail */
          <div className="animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => { setSelectedOrder(null); setShowQR(false); }}>
                <Icon name="ChevronLeft" size={24} style={{ color: 'rgba(255,255,255,0.6)' }} />
              </button>
              <h2 className="text-xl font-black text-white">Заказ #{selectedOrder.id?.slice(-6)}</h2>
            </div>

            {/* Current status */}
            <div className="rounded-2xl p-5 mb-4"
              style={{
                background: STATUS_COLORS[selectedOrder.status] + '12',
                border: `1px solid ${STATUS_COLORS[selectedOrder.status]}40`
              }}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{STATUS_ICONS[selectedOrder.status]}</span>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Текущий статус</div>
                  <div className="text-lg font-black" style={{ color: STATUS_COLORS[selectedOrder.status] }}>
                    {STATUS_LABELS[selectedOrder.status]}
                  </div>
                </div>
              </div>
            </div>

            {/* Change status */}
            <div className="rounded-2xl p-5 mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-sm font-bold text-white mb-3">Изменить статус</div>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STATUSES.map(status => (
                  <button key={status}
                    onClick={() => changeStatus(selectedOrder.id!, status)}
                    disabled={selectedOrder.status === status || updating === selectedOrder.id}
                    className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: selectedOrder.status === status ? STATUS_COLORS[status] + '30' : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${selectedOrder.status === status ? STATUS_COLORS[status] : 'rgba(255,255,255,0.08)'}`,
                      opacity: updating === selectedOrder.id && selectedOrder.status !== status ? 0.5 : 1,
                      cursor: selectedOrder.status === status ? 'default' : 'pointer',
                    }}>
                    <span>{STATUS_ICONS[status]}</span>
                    <span className="text-xs font-semibold"
                      style={{ color: selectedOrder.status === status ? STATUS_COLORS[status] : 'rgba(255,255,255,0.7)' }}>
                      {STATUS_LABELS[status]}
                    </span>
                    {selectedOrder.status === status && (
                      <Icon name="Check" size={12} className="ml-auto" style={{ color: STATUS_COLORS[status] }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* QR Code section */}
            <div className="rounded-2xl p-5 mb-4"
              style={{
                background: selectedOrder.status === 'ready' ? 'rgba(0,200,83,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedOrder.status === 'ready' ? 'rgba(0,200,83,0.3)' : 'rgba(255,255,255,0.08)'}`
              }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-white font-bold text-sm">QR-код выдачи</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {selectedOrder.status === 'ready' ? 'Доступен — заказ готов к выдаче' : 'Доступен только при статусе "Готов к выдаче"'}
                  </div>
                </div>
                {selectedOrder.status === 'ready' && (
                  <button onClick={() => setShowQR(!showQR)}
                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: '#00C853', color: 'white' }}>
                    {showQR ? 'Скрыть' : 'Показать'}
                  </button>
                )}
              </div>

              {showQR && selectedOrder.status === 'ready' && (
                <div className="animate-scale-in text-center pt-2">
                  <div className="inline-block p-4 bg-white rounded-2xl">
                    <QRCodeSVG value={`OZON-ORDER-${selectedOrder.id}`} size={180} level="H" />
                  </div>
                  <div className="text-xs mt-2 font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    OZON-{selectedOrder.id?.slice(-8).toUpperCase()}
                  </div>
                </div>
              )}

              {selectedOrder.status !== 'ready' && (
                <div className="flex items-center gap-2 mt-1">
                  <Icon name="Lock" size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Установите статус «Готов к выдаче», чтобы разблокировать QR
                  </span>
                </div>
              )}
            </div>

            {/* Customer info */}
            <div className="rounded-2xl p-5 mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-sm font-bold text-white mb-3">Клиент</div>
              <div className="flex gap-2 mb-2">
                <Icon name="User" size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{selectedOrder.userName}</span>
              </div>
              <div className="flex gap-2 mb-2">
                <Icon name="MapPin" size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {selectedOrder.address.street}, {selectedOrder.address.city}
                </span>
              </div>
              <div className="flex gap-2">
                <Icon name="CreditCard" size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {selectedOrder.payment.label} {selectedOrder.payment.last4 ? `•••• ${selectedOrder.payment.last4}` : ''}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="rounded-2xl p-5"
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
          </div>
        )}
      </div>
    </div>
  );
}
