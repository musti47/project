import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function Menu() {
  const [menu, setMenu] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [itemName, setItemName] = useState('');
  const [priceAmount, setPriceAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);

  const fetchProfile = async () => {
    const res = await apiFetch('/auth/me');
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || 'Profil alınamadı');
    }
    return data;
  };

  const fetchMenu = async (targetRestaurantId) => {
    const res = await apiFetch(`/menu?restaurantId=${targetRestaurantId}`);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.message || 'Menü alınamadı');
      setLoading(false);
      return;
    }

    setMenu(data);
    setLoading(false);

    if (!categoryId && data?.categories?.length > 0) {
      setCategoryId(String(data.categories[0].id));
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const profile = await fetchProfile();
        setRestaurantId(profile?.restaurantId);
        await fetchMenu(profile?.restaurantId);
      } catch (err) {
        setError(err.message || 'Bir hata oluştu');
        setLoading(false);
      }
    })();
  }, []);

  const createCategory = async (e) => {
    e.preventDefault();
    setError('');

    const res = await apiFetch('/menu/categories', {
      method: 'POST',
      body: JSON.stringify({ name: categoryName }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.message || 'Kategori oluşturulamadı');
      return;
    }

    setCategoryName('');
    await fetchMenu(restaurantId);
  };

  const deleteCategory = async (id) => {
    setError('');

    const res = await apiFetch(`/menu/categories/${id}`, {
      method: 'DELETE',
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.message || 'Kategori silinemedi');
      return;
    }

    await fetchMenu(restaurantId);
  };

  const createItem = async (e) => {
    e.preventDefault();
    setError('');

    const res = await apiFetch('/menu/items', {
      method: 'POST',
      body: JSON.stringify({
        name: itemName,
        priceAmount: Number(priceAmount),
        categoryId: Number(categoryId),
        description,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.message || 'Ürün oluşturulamadı');
      return;
    }

    setItemName('');
    setPriceAmount('');
    setDescription('');
    await fetchMenu(restaurantId);
  };

  const deleteItem = async (id) => {
    setError('');

    const res = await apiFetch(`/menu/items/${id}`, {
      method: 'DELETE',
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.message || 'Ürün silinemedi');
      return;
    }

    await fetchMenu(restaurantId);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Menü Yönetimi</h1>
            <p className="mt-1 text-sm text-slate-400">Kategori ve ürün yönetimi</p>
          </div>
          <Link to="/tables" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">
            Masalara Dön
          </Link>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <form onSubmit={createCategory} className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-lg font-bold">Kategori Ekle</h2>
            <div className="flex gap-3">
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Kategori adı"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 outline-none"
              />
              <button type="submit" className="rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950">
                Ekle
              </button>
            </div>
          </form>

          <form onSubmit={createItem} className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-lg font-bold">Ürün Ekle</h2>
            <div className="grid gap-3">
              <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Ürün adı" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 outline-none" />
              <input value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} type="number" placeholder="Fiyat" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 outline-none" />
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 outline-none">
                <option value="">Kategori seç</option>
                {menu?.categories?.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Açıklama" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 outline-none" />
              <button type="submit" className="rounded-xl bg-white px-4 py-2.5 font-semibold text-slate-950">Ürün Ekle</button>
            </div>
          </form>
        </div>

        <div className="space-y-5">
          {menu?.categories?.map((category) => (
            <section key={category.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{category.name}</h2>
                  <p className="text-sm text-slate-400">Kategori ID: {category.id}</p>
                </div>
                <button onClick={() => deleteCategory(category.id)} className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white">Kategoriyi Sil</button>
              </div>

              {category.items.length === 0 ? (
                <div className="rounded-2xl bg-slate-800 px-4 py-4 text-sm text-slate-400">Bu kategoride ürün yok</div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {category.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-800 p-4">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-slate-400">{item.priceAmount} ₺</p>
                      </div>
                      <button onClick={() => deleteItem(item.id)} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white">Sil</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Menu;
