import { db } from './firebase';
import { ref, set, push, onValue, update, get } from 'firebase/database';

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
