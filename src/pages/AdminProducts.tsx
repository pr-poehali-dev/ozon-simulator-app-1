import { useState, useEffect } from 'react';
import { Product, subscribeProducts, createProduct, updateProduct, deleteProduct, seedDefaultProducts } from '@/lib/store';
import Icon from '@/components/ui/icon';

const BADGE_OPTIONS = ['', 'Хит', 'Топ', 'Новинка', '-30%', '-20%', '-10%', 'Распродажа'];
const CATEGORY_SUGGESTIONS = ['Электроника', 'Ноутбуки', 'Обувь', 'Одежда', 'Бытовая техника', 'Спорт', 'Книги', 'Игрушки'];

const EMPTY_FORM = {
  name: '',
  price: '',
  image: '',
  category: '',
  rating: '4.5',
  reviews: '0',
  badge: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    seedDefaultProducts();
    const unsub = subscribeProducts((prods) => {
      setProducts(prods);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  function openCreate() {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({
      name: p.name,
      price: String(p.price),
      image: p.image,
      category: p.category,
      rating: String(p.rating),
      reviews: String(p.reviews),
      badge: p.badge ?? '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditProduct(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price || !form.category.trim()) return;
    setSaving(true);
    const data = {
      name: form.name.trim(),
      price: Number(form.price),
      image: form.image.trim() || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
      category: form.category.trim(),
      rating: Math.min(5, Math.max(0, Number(form.rating) || 4.5)),
      reviews: Math.max(0, Number(form.reviews) || 0),
      badge: form.badge || undefined,
    };
    if (editProduct) {
      await updateProduct(editProduct.id, data);
    } else {
      await createProduct(data);
    }
    setSaving(false);
    closeForm();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteProduct(id);
    setDeletingId(null);
  }

  const filtered = products.filter(p =>
    search === '' ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeInA 0.35s ease' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Icon name="Search" size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск товара..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:opacity-40"
          />
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #005BFF, #00D4FF)', boxShadow: '0 4px 16px rgba(0,91,255,0.35)' }}>
          <Icon name="Plus" size={16} /> Добавить
        </button>
      </div>

      {/* Stats */}
      <div className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Всего товаров: {products.length}
      </div>

      {/* Product List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#00D4FF', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📦</div>
          <div className="text-white font-semibold mb-1">Товаров нет</div>
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Добавьте первый товар</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <img src={p.image} alt={p.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'; }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {p.badge && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: 'rgba(255,63,63,0.2)', color: '#FF6B6B' }}>
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.category}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>★ {p.rating}</span>
                </div>
                <div className="text-base font-black mt-1" style={{ color: '#00D4FF' }}>
                  {p.price.toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => openEdit(p)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-105"
                  style={{ background: 'rgba(0,212,255,0.12)', color: '#00D4FF' }}>
                  <Icon name="Pencil" size={15} />
                </button>
                <button onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-105"
                  style={{ background: 'rgba(255,63,63,0.12)', color: '#FF6B6B' }}>
                  {deletingId === p.id
                    ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#FF6B6B', borderTopColor: 'transparent' }} />
                    : <Icon name="Trash2" size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div className="w-full max-w-md rounded-3xl p-6 flex flex-col gap-4"
            style={{ background: '#0E1425', border: '1px solid rgba(0,212,255,0.2)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between">
              <div className="text-lg font-black text-white">
                {editProduct ? 'Редактировать товар' : 'Новый товар'}
              </div>
              <button onClick={closeForm} style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Image preview */}
            {form.image && (
              <img src={form.image} alt="preview"
                className="w-full h-40 object-cover rounded-2xl"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}

            <div className="flex flex-col gap-3">
              <FormField label="Название товара *">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Например: iPhone 15 Pro"
                  className="w-full bg-transparent outline-none text-sm text-white placeholder:opacity-40" />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Цена (₽) *">
                  <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    type="number" min="0" placeholder="0"
                    className="w-full bg-transparent outline-none text-sm text-white placeholder:opacity-40" />
                </FormField>
                <FormField label="Значок">
                  <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                    className="w-full bg-transparent outline-none text-sm text-white"
                    style={{ background: 'transparent' }}>
                    {BADGE_OPTIONS.map(b => (
                      <option key={b} value={b} style={{ background: '#0E1425' }}>{b || '— нет —'}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Категория *">
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="Электроника, Одежда..."
                  list="category-list"
                  className="w-full bg-transparent outline-none text-sm text-white placeholder:opacity-40" />
                <datalist id="category-list">
                  {CATEGORY_SUGGESTIONS.map(c => <option key={c} value={c} />)}
                </datalist>
              </FormField>

              <FormField label="Ссылка на фото">
                <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-transparent outline-none text-sm text-white placeholder:opacity-40" />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Рейтинг (0–5)">
                  <input value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                    type="number" min="0" max="5" step="0.1" placeholder="4.5"
                    className="w-full bg-transparent outline-none text-sm text-white placeholder:opacity-40" />
                </FormField>
                <FormField label="Отзывов">
                  <input value={form.reviews} onChange={e => setForm(f => ({ ...f, reviews: e.target.value }))}
                    type="number" min="0" placeholder="0"
                    className="w-full bg-transparent outline-none text-sm text-white placeholder:opacity-40" />
                </FormField>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.price || !form.category.trim()}
              className="w-full py-4 rounded-2xl font-black text-white text-base transition-all"
              style={{
                background: (saving || !form.name.trim() || !form.price || !form.category.trim())
                  ? 'rgba(255,255,255,0.1)'
                  : 'linear-gradient(135deg, #005BFF, #00D4FF)',
                boxShadow: (saving || !form.name.trim() || !form.price || !form.category.trim())
                  ? 'none'
                  : '0 8px 24px rgba(0,91,255,0.4)',
              }}>
              {saving ? 'Сохранение...' : editProduct ? 'Сохранить изменения' : 'Создать товар'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</div>
      <div className="px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {children}
      </div>
    </div>
  );
}
