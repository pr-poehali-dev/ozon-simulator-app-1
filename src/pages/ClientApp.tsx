import { useState, useEffect } from 'react';
import { PRODUCTS, Product, CartItem, Order, Address, PaymentMethod, createOrder, subscribeUserOrders, STATUS_LABELS, STATUS_COLORS } from '@/lib/store';
import Icon from '@/components/ui/icon';
import { QRCodeSVG } from 'qrcode.react';

const USER_ID = 'user_' + Math.random().toString(36).slice(2, 9);
const USER_NAME = 'Иван Петров';

const SAVED_ADDRESSES: Address[] = [
  { id: 'a1', title: '🏠 Дом', street: 'ул. Ленина, 42, кв. 15', city: 'Москва', zip: '101000' },
  { id: 'a2', title: '💼 Работа', street: 'ул. Тверская, 10, офис 301', city: 'Москва', zip: '103132' },
  { id: 'a3', title: '📦 ПВЗ Ozon', street: 'пр. Мира, 150', city: 'Москва', zip: '129085' },
];

const SAVED_PAYMENTS: PaymentMethod[] = [
  { id: 'p1', type: 'card', label: 'Visa', last4: '4242' },
  { id: 'p2', type: 'card', label: 'Mastercard', last4: '8821' },
  { id: 'p3', type: 'sbp', label: 'СБП — Сбербанк' },
];

type Tab = 'catalog' | 'cart' | 'orders' | 'profile';

interface Props { onExit: () => void; }

export default function ClientApp({ onExit }: Props) {
  const [tab, setTab] = useState<Tab>('catalog');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все');
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState<Address>(SAVED_ADDRESSES[0]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(SAVED_PAYMENTS[0]);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [qrOrderId, setQrOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsub = subscribeUserOrders(USER_ID, setOrders);
    return () => unsub();
  }, []);

  const categories = ['Все', ...Array.from(new Set(PRODUCTS.map(p => p.category)))];
  const filtered = PRODUCTS.filter(p =>
    (category === 'Все' || p.category === category) &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(i => i.product.id !== id));
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(i => i.product.id === id
      ? { ...i, quantity: Math.max(1, i.quantity + delta) }
      : i
    ).filter(i => i.quantity > 0));
  }

  async function placeOrder() {
    const order = {
      userId: USER_ID,
      userName: USER_NAME,
      items: cart,
      address: selectedAddress,
      payment: selectedPayment,
      total: cartTotal,
      status: 'pending' as const,
      createdAt: Date.now(),
    };
    const id = await createOrder(order);
    setCart([]);
    setCheckoutStep(0);
    setOrderSuccess(id);
    setTab('orders');
  }

  // Sync selected order with live data
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  return (
    <div className="min-h-screen" style={{ background: '#F4F6FA' }}>
      {/* Header */}
      <header className="sticky top-0 z-40"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,91,255,0.1)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onExit} className="text-gray-400 hover:text-gray-600 transition-colors">
              <Icon name="ChevronLeft" size={24} />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-black"
                style={{ background: 'linear-gradient(135deg, #005BFF, #00D4FF)' }}>O</div>
              <span className="text-xl font-black" style={{ color: '#005BFF' }}>ZON</span>
            </div>
            <div className="relative" style={{ width: '50%' }}>
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск товаров"
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none transition-all"
                style={{ background: '#F0F4FF', border: '1.5px solid transparent' }}
                onFocus={e => e.target.style.borderColor = '#005BFF'}
                onBlur={e => e.target.style.borderColor = 'transparent'}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-28">
        {tab === 'catalog' && (
          <div className="animate-fade-in">
            {/* Banner */}
            <div className="mt-4 mb-5 rounded-3xl overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, #005BFF 0%, #0037CC 100%)', minHeight: '140px' }}>
              <div className="p-6 relative z-10">
                <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#00D4FF' }}>Мега распродажа</div>
                <div className="text-2xl font-black text-white leading-tight">Скидки до 70%<br />на всё!</div>
                <button className="mt-3 px-4 py-2 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                  Смотреть →
                </button>
              </div>
              <div className="absolute right-4 bottom-0 text-7xl opacity-30">🛍️</div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 py-1">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className="whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 shrink-0"
                  style={{
                    background: category === cat ? '#005BFF' : 'white',
                    color: category === cat ? 'white' : '#555',
                    boxShadow: category === cat ? '0 4px 16px rgba(0,91,255,0.3)' : '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Products grid */}
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((product, i) => (
                <div key={product.id}
                  className="card-hover rounded-2xl overflow-hidden bg-white"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', animationDelay: `${i * 0.05}s` }}>
                  <div className="relative">
                    <img src={product.image} alt={product.name}
                      className="w-full h-36 object-cover" />
                    {product.badge && (
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold text-white"
                        style={{ background: product.badge.includes('%') ? '#FF3F3F' : product.badge === 'Хит' ? '#FF8C00' : '#005BFF' }}>
                        {product.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-gray-400 mb-1">{product.category}</div>
                    <div className="text-sm font-semibold text-gray-800 mb-1 leading-tight line-clamp-2">{product.name}</div>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-xs text-gray-500">{product.rating} ({product.reviews.toLocaleString()})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-base font-black" style={{ color: '#005BFF' }}>
                        {product.price.toLocaleString()} ₽
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all active:scale-95"
                        style={{ background: '#005BFF' }}>
                        <Icon name="Plus" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'cart' && (
          <div className="animate-fade-in mt-4">
            {checkoutStep === 0 && (
              <>
                <h2 className="text-xl font-black mb-4">Корзина</h2>
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🛒</div>
                    <div className="text-gray-400 font-medium">Корзина пуста</div>
                    <button onClick={() => setTab('catalog')} className="mt-4 px-6 py-3 rounded-2xl text-white font-semibold"
                      style={{ background: '#005BFF' }}>
                      В каталог
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {cart.map(item => (
                        <div key={item.product.id} className="bg-white rounded-2xl p-4 flex gap-3"
                          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                          <img src={item.product.image} alt={item.product.name}
                            className="w-16 h-16 rounded-xl object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">{item.product.name}</div>
                            <div className="text-base font-black" style={{ color: '#005BFF' }}>
                              {(item.product.price * item.quantity).toLocaleString()} ₽
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <button onClick={() => removeFromCart(item.product.id)}
                              className="text-red-400 hover:text-red-600 transition-colors">
                              <Icon name="Trash2" size={16} />
                            </button>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(item.product.id, -1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 text-gray-600">
                                <Icon name="Minus" size={12} />
                              </button>
                              <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                              <button onClick={() => updateQty(item.product.id, 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                                style={{ background: '#005BFF' }}>
                                <Icon name="Plus" size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500">Итого ({cartCount} товара)</span>
                        <span className="text-2xl font-black" style={{ color: '#005BFF' }}>{cartTotal.toLocaleString()} ₽</span>
                      </div>
                      <button onClick={() => setCheckoutStep(1)}
                        className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-98"
                        style={{ background: 'linear-gradient(135deg, #005BFF, #0037CC)', boxShadow: '0 8px 24px rgba(0,91,255,0.35)' }}>
                        Оформить заказ
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {checkoutStep === 1 && (
              <div className="animate-scale-in">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setCheckoutStep(0)}>
                    <Icon name="ChevronLeft" size={24} className="text-gray-500" />
                  </button>
                  <h2 className="text-xl font-black">Оформление</h2>
                </div>

                {/* Delivery address */}
                <div className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="MapPin" size={18} style={{ color: '#005BFF' }} />
                    <span className="font-bold text-gray-800">Адрес доставки</span>
                  </div>
                  <div className="space-y-2">
                    {SAVED_ADDRESSES.map(addr => (
                      <label key={addr.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                        style={{ background: selectedAddress.id === addr.id ? '#EEF4FF' : '#F8F9FA', border: `1.5px solid ${selectedAddress.id === addr.id ? '#005BFF' : 'transparent'}` }}>
                        <input type="radio" checked={selectedAddress.id === addr.id}
                          onChange={() => setSelectedAddress(addr)} className="hidden" />
                        <div className={`w-4 h-4 rounded-full border-2 transition-all`}
                          style={{ borderColor: selectedAddress.id === addr.id ? '#005BFF' : '#ddd', background: selectedAddress.id === addr.id ? '#005BFF' : 'white' }} />
                        <div>
                          <div className="text-sm font-semibold">{addr.title}</div>
                          <div className="text-xs text-gray-500">{addr.street}, {addr.city}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="CreditCard" size={18} style={{ color: '#005BFF' }} />
                    <span className="font-bold text-gray-800">Способ оплаты</span>
                  </div>
                  <div className="space-y-2">
                    {SAVED_PAYMENTS.map(pay => (
                      <label key={pay.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                        style={{ background: selectedPayment.id === pay.id ? '#EEF4FF' : '#F8F9FA', border: `1.5px solid ${selectedPayment.id === pay.id ? '#005BFF' : 'transparent'}` }}>
                        <input type="radio" checked={selectedPayment.id === pay.id}
                          onChange={() => setSelectedPayment(pay)} className="hidden" />
                        <div className="w-4 h-4 rounded-full border-2 transition-all"
                          style={{ borderColor: selectedPayment.id === pay.id ? '#005BFF' : '#ddd', background: selectedPayment.id === pay.id ? '#005BFF' : 'white' }} />
                        <div className="flex-1">
                          <div className="text-sm font-semibold">
                            {pay.type === 'card' ? `💳 ${pay.label}` : `📱 ${pay.label}`}
                            {pay.last4 && <span className="text-gray-400 font-normal ml-1">•••• {pay.last4}</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Order summary */}
                <div className="bg-white rounded-2xl p-5 mb-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                    <span>Товаров на сумму</span>
                    <span>{cartTotal.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <span>Доставка</span>
                    <span className="text-green-600 font-semibold">Бесплатно</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-bold">К оплате</span>
                    <span className="text-2xl font-black" style={{ color: '#005BFF' }}>{cartTotal.toLocaleString()} ₽</span>
                  </div>
                </div>

                <button onClick={placeOrder}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-98"
                  style={{ background: 'linear-gradient(135deg, #005BFF, #0037CC)', boxShadow: '0 8px 24px rgba(0,91,255,0.35)' }}>
                  Оплатить {cartTotal.toLocaleString()} ₽
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <div className="animate-fade-in mt-4">
            {selectedOrder ? (
              <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />
            ) : (
              <>
                <h2 className="text-xl font-black mb-4">Мои заказы</h2>
                {orderSuccess && (
                  <div className="mb-4 p-4 rounded-2xl flex items-center gap-3"
                    style={{ background: 'linear-gradient(135deg, #00C85315, #00C85308)', border: '1px solid #00C85340' }}>
                    <div className="text-2xl">✅</div>
                    <div>
                      <div className="font-bold text-green-700">Заказ оформлен!</div>
                      <div className="text-sm text-green-600">Ожидайте подтверждения</div>
                    </div>
                    <button onClick={() => setOrderSuccess(null)} className="ml-auto text-green-400">
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                )}
                {orders.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📦</div>
                    <div className="text-gray-400 font-medium">Заказов пока нет</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map(order => (
                      <button key={order.id} onClick={() => setSelectedOrder(order)}
                        className="w-full bg-white rounded-2xl p-4 text-left transition-all hover:shadow-md"
                        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-gray-800 text-sm">Заказ #{order.id?.slice(-6)}</div>
                            <div className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('ru')}</div>
                          </div>
                          <div className="status-badge" style={{
                            background: STATUS_COLORS[order.status] + '20',
                            color: STATUS_COLORS[order.status]
                          }}>
                            {order.status === 'ready' && '✅ '}
                            {STATUS_LABELS[order.status]}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {order.items.slice(0, 3).map(item => (
                            <img key={item.product.id} src={item.product.image}
                              className="w-10 h-10 rounded-lg object-cover" />
                          ))}
                          {order.items.length > 3 && (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                              +{order.items.length - 3}
                            </div>
                          )}
                          <span className="ml-auto text-base font-black" style={{ color: '#005BFF' }}>
                            {order.total.toLocaleString()} ₽
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="animate-fade-in mt-4">
            <div className="bg-white rounded-3xl p-6 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-white font-bold"
                  style={{ background: 'linear-gradient(135deg, #005BFF, #00D4FF)' }}>
                  ИП
                </div>
                <div>
                  <div className="text-xl font-black">{USER_NAME}</div>
                  <div className="text-sm text-gray-400">+7 (999) 123-45-67</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Сохранённые адреса</h3>
                {SAVED_ADDRESSES.map(addr => (
                  <div key={addr.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F8F9FA' }}>
                    <span className="text-xl">{addr.title.slice(0, 2)}</span>
                    <div>
                      <div className="text-sm font-semibold">{addr.title.slice(3)}</div>
                      <div className="text-xs text-gray-400">{addr.street}, {addr.city}</div>
                    </div>
                  </div>
                ))}

                <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mt-5 pt-2 border-t">Способы оплаты</h3>
                {SAVED_PAYMENTS.map(pay => (
                  <div key={pay.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F8F9FA' }}>
                    <span className="text-xl">{pay.type === 'card' ? '💳' : '📱'}</span>
                    <div>
                      <div className="text-sm font-semibold">{pay.label}</div>
                      {pay.last4 && <div className="text-xs text-gray-400">•••• {pay.last4}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="max-w-2xl mx-auto px-2 py-2">
          <div className="flex">
            {([
              { key: 'catalog', icon: 'Home', label: 'Главная' },
              { key: 'cart', icon: 'ShoppingCart', label: 'Корзина' },
              { key: 'orders', icon: 'Package', label: 'Заказы' },
              { key: 'profile', icon: 'User', label: 'Профиль' },
            ] as { key: Tab; icon: string; label: string }[]).map(({ key, icon, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className="flex-1 flex flex-col items-center gap-1 py-2 transition-all relative">
                {key === 'cart' && cartCount > 0 && (
                  <div className="absolute top-1 left-1/2 translate-x-2 -translate-y-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ background: '#FF3F3F' }}>
                    {cartCount}
                  </div>
                )}
                <Icon name={icon} size={22} style={{ color: tab === key ? '#005BFF' : '#9CA3AF' }} />
                <span className="text-xs font-semibold" style={{ color: tab === key ? '#005BFF' : '#9CA3AF' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}

function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  return (
    <div className="animate-scale-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}>
          <Icon name="ChevronLeft" size={24} className="text-gray-500" />
        </button>
        <h2 className="text-xl font-black">Заказ #{order.id?.slice(-6)}</h2>
      </div>

      {/* Status */}
      <div className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: STATUS_COLORS[order.status] + '20' }}>
            <span className="text-xl">
              {order.status === 'pending' && '⏳'}
              {order.status === 'processing' && '🔄'}
              {order.status === 'shipped' && '🚚'}
              {order.status === 'ready' && '✅'}
              {order.status === 'delivered' && '🎉'}
              {order.status === 'cancelled' && '❌'}
            </span>
          </div>
          <div>
            <div className="font-bold" style={{ color: STATUS_COLORS[order.status] }}>
              {STATUS_LABELS[order.status]}
            </div>
            <div className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('ru')}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mt-3">
          {(['pending', 'processing', 'shipped', 'ready', 'delivered'] as const).map((s, i, arr) => {
            const statuses = ['pending', 'processing', 'shipped', 'ready', 'delivered'];
            const currentIndex = statuses.indexOf(order.status);
            const isActive = i <= currentIndex && order.status !== 'cancelled';
            return (
              <div key={s} className="flex-1 h-1.5 rounded-full transition-all duration-500"
                style={{ background: isActive ? STATUS_COLORS[order.status] : '#E5E7EB' }} />
            );
          })}
        </div>
      </div>

      {/* QR Code — only when ready */}
      {order.status === 'ready' && (
        <div className="bg-white rounded-2xl p-6 mb-4 text-center animate-scale-in"
          style={{ boxShadow: '0 8px 32px rgba(0,200,83,0.2)', border: '2px solid #00C853' }}>
          <div className="text-green-600 font-bold mb-1">✅ Заказ готов к выдаче!</div>
          <div className="text-sm text-gray-500 mb-4">Покажите QR-код на пункте выдачи</div>
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-white rounded-2xl" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
              <QRCodeSVG value={`OZON-ORDER-${order.id}`} size={160} level="H"
                imageSettings={{ src: '', x: undefined, y: undefined, height: 0, width: 0, excavate: false }} />
            </div>
          </div>
          <div className="text-xs text-gray-400 font-mono">OZON-{order.id?.slice(-8).toUpperCase()}</div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="font-bold mb-3">Состав заказа</div>
        <div className="space-y-3">
          {order.items.map(item => (
            <div key={item.product.id} className="flex gap-3">
              <img src={item.product.image} className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800 line-clamp-1">{item.product.name}</div>
                <div className="text-xs text-gray-400">{item.quantity} шт × {item.product.price.toLocaleString()} ₽</div>
              </div>
              <div className="text-sm font-bold" style={{ color: '#005BFF' }}>
                {(item.product.price * item.quantity).toLocaleString()} ₽
              </div>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between">
          <span className="font-bold">Итого</span>
          <span className="text-xl font-black" style={{ color: '#005BFF' }}>{order.total.toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Address & Payment */}
      <div className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="flex gap-2 mb-1">
          <Icon name="MapPin" size={16} style={{ color: '#005BFF' }} />
          <span className="text-sm font-bold">Адрес</span>
        </div>
        <div className="text-sm text-gray-500 pl-6">{order.address.street}, {order.address.city}</div>
        <div className="flex gap-2 mt-3 mb-1">
          <Icon name="CreditCard" size={16} style={{ color: '#005BFF' }} />
          <span className="text-sm font-bold">Оплата</span>
        </div>
        <div className="text-sm text-gray-500 pl-6">{order.payment.label} {order.payment.last4 ? `•••• ${order.payment.last4}` : ''}</div>
      </div>
    </div>
  );
}