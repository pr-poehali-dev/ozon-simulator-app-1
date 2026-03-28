import { db } from './firebase';
import { ref, set, push, onValue, update, get, remove } from 'firebase/database';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  badge?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  id: string;
  title: string;
  street: string;
  city: string;
  zip: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'sbp';
  label: string;
  last4?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'ready' | 'delivered' | 'cancelled';
export type DeliveryType = 'delivery' | 'pickup';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: CartItem[];
  address: Address;
  payment: PaymentMethod;
  total: number;
  status: OrderStatus;
  createdAt: number;
  qrCode?: string;
  deliveryType?: DeliveryType;
  comment?: string;
}

export const PRODUCTS: Product[] = [
  { id: '1', name: 'iPhone 15 Pro Max 256GB', price: 119990, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80', category: 'Электроника', rating: 4.9, reviews: 2341, badge: 'Хит' },
  { id: '2', name: 'Sony WH-1000XM5 Наушники', price: 29990, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80', category: 'Электроника', rating: 4.8, reviews: 1204, badge: 'Топ' },
  { id: '3', name: 'MacBook Air M3 13"', price: 129990, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80', category: 'Ноутбуки', rating: 4.9, reviews: 876 },
  { id: '4', name: 'Nike Air Max 270', price: 12990, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', category: 'Обувь', rating: 4.7, reviews: 3421, badge: '-30%' },
  { id: '5', name: 'Кофемашина DeLonghi Magnifica', price: 54990, image: 'https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=400&q=80', category: 'Бытовая техника', rating: 4.6, reviews: 654 },
  { id: '6', name: 'Samsung Galaxy S24 Ultra', price: 109990, image: 'https://images.unsplash.com/photo-1707412911484-7b0440f2c1f6?w=400&q=80', category: 'Электроника', rating: 4.8, reviews: 1876, badge: 'Новинка' },
  { id: '7', name: 'Dyson V15 Detect', price: 64990, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', category: 'Бытовая техника', rating: 4.7, reviews: 432 },
  { id: '8', name: 'Levi\'s 501 Original Jeans', price: 7990, image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80', category: 'Одежда', rating: 4.5, reviews: 5621, badge: '-20%' },
  { id: '9', name: 'Карандаши цветные 36 шт', price: 349, image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80', category: 'Канцелярия', rating: 4.7, reviews: 892 },
  { id: '10', name: 'NFC-карта для оплаты', price: 799, image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80', category: 'Электроника', rating: 4.5, reviews: 314, badge: 'Новинка' },
  { id: '11', name: 'Беспроводная мышка Logitech', price: 2490, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80', category: 'Электроника', rating: 4.8, reviews: 1560 },
  { id: '12', name: 'Декоративная свеча', price: 590, image: 'https://images.unsplash.com/photo-1603905987975-3f4e574c8ce5?w=400&q=80', category: 'Декор', rating: 4.6, reviews: 430 },
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ожидает подтверждения',
  processing: 'В обработке',
  shipped: 'В пути',
  ready: 'Готов к выдаче',
  delivered: 'Получен',
  cancelled: 'Отменён',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  ready: '#10b981',
  delivered: '#6b7280',
  cancelled: '#ef4444',
};

export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
  const ordersRef = ref(db, 'orders');
  const newRef = push(ordersRef);
  await set(newRef, { ...order, id: newRef.key });
  return newRef.key!;
}

export function subscribeOrders(callback: (orders: Order[]) => void) {
  const ordersRef = ref(db, 'orders');
  return onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return callback([]);
    const orders = Object.values(data) as Order[];
    callback(orders.sort((a, b) => b.createdAt - a.createdAt));
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const orderRef = ref(db, `orders/${orderId}`);
  await update(orderRef, { status });
}

export function subscribeUserOrders(userId: string, callback: (orders: Order[]) => void) {
  const ordersRef = ref(db, 'orders');
  return onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return callback([]);
    const orders = (Object.values(data) as Order[])
      .filter(o => o.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
    callback(orders);
  });
}

export function subscribeProducts(callback: (products: Product[]) => void) {
  const productsRef = ref(db, 'products');
  return onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return callback([...PRODUCTS]);
    const products = Object.values(data) as Product[];
    callback(products.sort((a, b) => a.name.localeCompare(b.name)));
  });
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<string> {
  const productsRef = ref(db, 'products');
  const newRef = push(productsRef);
  await set(newRef, { ...product, id: newRef.key });
  return newRef.key!;
}

export async function updateProduct(productId: string, data: Partial<Omit<Product, 'id'>>) {
  const productRef = ref(db, `products/${productId}`);
  await update(productRef, data);
}

export async function deleteProduct(productId: string) {
  const productRef = ref(db, `products/${productId}`);
  await remove(productRef);
}

export async function seedDefaultProducts() {
  const snapshot = await get(ref(db, 'products'));
  if (snapshot.exists()) {
    const existing = Object.values(snapshot.val()) as Product[];
    const existingNames = new Set(existing.map(p => p.name));
    const productsRef = ref(db, 'products');
    for (const p of PRODUCTS) {
      if (!existingNames.has(p.name)) {
        const newRef = push(productsRef);
        await set(newRef, { ...p, id: newRef.key });
      }
    }
    return;
  }
  const productsRef = ref(db, 'products');
  for (const p of PRODUCTS) {
    const newRef = push(productsRef);
    await set(newRef, { ...p, id: newRef.key });
  }
}

export function subscribeUserAddresses(userId: string, callback: (addresses: Address[]) => void) {
  return onValue(ref(db, `userAddresses/${userId}`), (snap) => {
    if (!snap.exists()) return callback([]);
    const addresses = Object.values(snap.val()) as Address[];
    callback(addresses);
  });
}

export async function saveUserAddress(userId: string, address: Omit<Address, 'id'>): Promise<string> {
  const r = push(ref(db, `userAddresses/${userId}`));
  await set(r, { ...address, id: r.key });
  return r.key!;
}

export async function deleteUserAddress(userId: string, addressId: string) {
  await remove(ref(db, `userAddresses/${userId}/${addressId}`));
}

// ─── BALANCE ───────────────────────────────────────────────────────────────

export interface BalanceTransaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  createdAt: number;
}

export async function getUserBalance(uid: string): Promise<number> {
  const snap = await get(ref(db, `balances/${uid}/amount`));
  return snap.exists() ? (snap.val() as number) : 0;
}

export function subscribeUserBalance(uid: string, callback: (amount: number) => void) {
  return onValue(ref(db, `balances/${uid}/amount`), (snap) => {
    callback(snap.exists() ? (snap.val() as number) : 0);
  });
}

export async function topUpBalanceByEmail(email: string, amount: number, adminNote: string): Promise<{ success: boolean; userName: string }> {
  const usersSnap = await get(ref(db, 'users'));
  if (!usersSnap.exists()) throw new Error('Пользователь не найден');
  const users = Object.values(usersSnap.val()) as { uid: string; email: string; name: string }[];
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('Пользователь с таким email не найден');

  const balRef = ref(db, `balances/${user.uid}/amount`);
  const curSnap = await get(balRef);
  const current = curSnap.exists() ? (curSnap.val() as number) : 0;
  await set(balRef, current + amount);

  const txRef = push(ref(db, `balances/${user.uid}/transactions`));
  await set(txRef, {
    id: txRef.key,
    amount,
    type: 'credit',
    description: adminNote || 'Пополнение администратором',
    createdAt: Date.now(),
  } as BalanceTransaction);

  return { success: true, userName: user.name };
}

export async function deductBalance(uid: string, amount: number, description: string) {
  const balRef = ref(db, `balances/${uid}/amount`);
  const curSnap = await get(balRef);
  const current = curSnap.exists() ? (curSnap.val() as number) : 0;
  if (current < amount) throw new Error('Недостаточно средств на балансе');
  await set(balRef, current - amount);
  const txRef = push(ref(db, `balances/${uid}/transactions`));
  await set(txRef, {
    id: txRef.key,
    amount,
    type: 'debit',
    description,
    createdAt: Date.now(),
  } as BalanceTransaction);
}

export function subscribeAllBalances(callback: (data: { uid: string; email: string; name: string; balance: number }[]) => void) {
  return onValue(ref(db, 'users'), async (usersSnap) => {
    if (!usersSnap.exists()) return callback([]);
    const users = Object.values(usersSnap.val()) as { uid: string; email: string; name: string; role: string }[];
    const clients = users.filter(u => u.role === 'client');
    const balSnap = await get(ref(db, 'balances'));
    const balances = balSnap.exists() ? balSnap.val() : {};
    callback(clients.map(u => ({
      uid: u.uid,
      email: u.email,
      name: u.name,
      balance: balances[u.uid]?.amount ?? 0,
    })));
  });
}

// ─── PROMO CODES ───────────────────────────────────────────────────────────

export type PromoType = 'percent' | 'fixed';

export interface PromoCode {
  id: string;
  code: string;
  type: PromoType;
  value: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  createdAt: number;
  expiresAt?: number;
}

export function subscribePromoCodes(callback: (promos: PromoCode[]) => void) {
  return onValue(ref(db, 'promoCodes'), (snap) => {
    if (!snap.exists()) return callback([]);
    const promos = Object.values(snap.val()) as PromoCode[];
    callback(promos.sort((a, b) => b.createdAt - a.createdAt));
  });
}

export async function createPromoCode(promo: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'>): Promise<string> {
  const r = push(ref(db, 'promoCodes'));
  await set(r, { ...promo, id: r.key, usedCount: 0, createdAt: Date.now() });
  return r.key!;
}

export async function updatePromoCode(id: string, data: Partial<PromoCode>) {
  await update(ref(db, `promoCodes/${id}`), data);
}

export async function deletePromoCode(id: string) {
  await remove(ref(db, `promoCodes/${id}`));
}

export async function applyPromoCode(code: string, cartTotal: number): Promise<{ discount: number; promo: PromoCode }> {
  const snap = await get(ref(db, 'promoCodes'));
  if (!snap.exists()) throw new Error('Промокод не найден');
  const promos = Object.values(snap.val()) as PromoCode[];
  const promo = promos.find(p => p.code.toUpperCase() === code.toUpperCase());
  if (!promo) throw new Error('Промокод не найден');
  if (!promo.active) throw new Error('Промокод неактивен');
  if (promo.usedCount >= promo.maxUses) throw new Error('Промокод исчерпан');
  if (promo.expiresAt && promo.expiresAt < Date.now()) throw new Error('Промокод истёк');
  const discount = promo.type === 'percent'
    ? Math.round(cartTotal * promo.value / 100)
    : Math.min(promo.value, cartTotal);
  return { discount, promo };
}

export async function incrementPromoUsage(promoId: string) {
  const snap = await get(ref(db, `promoCodes/${promoId}/usedCount`));
  const count = snap.exists() ? (snap.val() as number) : 0;
  await update(ref(db, `promoCodes/${promoId}`), { usedCount: count + 1 });
}