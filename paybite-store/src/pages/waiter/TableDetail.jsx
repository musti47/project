import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL;
const money = (value) => `${Number(value || 0).toLocaleString('tr-TR')} ₺`;

function TableDetail() {
  const { id } = useParams();
  const tableId = Number(id);
  const navigate = useNavigate();

  const [table, setTable] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [splits, setSplits] = useState([]);
  const [bill, setBill] = useState(null);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [manualAmount, setManualAmount] = useState('');

  const fetchAll = async () => {
    const [tablesRes, ordersRes, splitsRes, billRes, meRes] = await Promise.all([
      apiFetch('/tables'),
      apiFetch(`/orders/table/${tableId}`),
      apiFetch(`/payments/table/${tableId}/pending-splits`),
      apiFetch(`/bill/${tableId}`),
      apiFetch('/auth/me'),
    ]);

    const [tablesData, ordersData, splitsData, billData, meData] = await Promise.all([
      tablesRes.json().catch(() => []),
      ordersRes.json().catch(() => []),
      splitsRes.json().catch(() => []),
      billRes.json().catch(() => null),
      meRes.json().catch(() => null),
    ]);

    if (!tablesRes.ok || !ordersRes.ok || !splitsRes.ok || !billRes.ok || !meRes.ok) {
      setError(
        tablesData?.message || ordersData?.message || splitsData?.message || billData?.message || meData?.message || 'Veri alınamadı',
      );
      setLoading(false);
      return;
    }

    const safeTables = Array.isArray(tablesData) ? tablesData : [];
    const currentTable = safeTables.find((item) => item.id === tableId) || null;
    setTable(currentTable);
    setOrders(Array.isArray(ordersData) ? ordersData : []);
    setSplits(Array.isArray(splitsData) ? splitsData : []);
    setBill(billData);
    setRestaurant(meData?.restaurant || null);
    setError('');

    if (currentTable?.restaurantId) {
      const menuRes = await apiFetch(`/menu?restaurantId=${currentTable.restaurantId}`);
      const menuData = await menuRes.json().catch(() => null);
      if (menuRes.ok) {
        setMenu(Array.isArray(menuData?.categories) ? menuData.categories : []);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [tableId]);

  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'] });
    socket.emit('joinTable', { tableId });
    socket.on(`table-${tableId}-updated`, () => {
      fetchAll();
    });
    return () => socket.disconnect();
  }, [tableId]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.priceAmount * item.quantity, 0),
    [cart],
  );

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((row) => row.id === item.id);
      if (existing) {
        return prev.map((row) => (row.id === item.id ? { ...row, quantity: row.quantity + 1 } : row));
      }
      return [...prev, { id: item.id, name: item.name, priceAmount: item.priceAmount, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId, quantity) => {
    setCart((prev) => prev.map((row) => (row.id === itemId ? { ...row, quantity } : row)).filter((row) => row.quantity > 0));
  };

  const createOrder = async () => {
    if (cart.length === 0) {
      setError('Sepet boş');
      return;
    }

    const orderRes = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({ tableId }),
    });
    const orderData = await orderRes.json().catch(() => null);
    if (!orderRes.ok) {
      setError(orderData?.message || 'Sipariş başlatılamadı');
      return;
    }

    for (const item of cart) {
      const itemRes = await apiFetch(`/orders/${orderData.id}/items`, {
        method: 'POST',
        body: JSON.stringify({
          menuItemId: item.id,
          quantity: item.quantity,
        }),
      });
      const itemData = await itemRes.json().catch(() => null);
      if (!itemRes.ok) {
        setError(itemData?.message || 'Sipariş kalemi eklenemedi');
        return;
      }
    }

    setCart([]);
    fetchAll();
  };

  const updateOrderStatus = async (orderId, status) => {
    const res = await apiFetch(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message || 'Durum güncellenemedi');
      return;
    }
    fetchAll();
  };

  const enablePayment = async () => {
    const res = await apiFetch(`/tables/${tableId}/enable-payment`, { method: 'PATCH' });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message || 'Ödeme açılamadı');
      return;
    }
    fetchAll();
  };

  const disablePayment = async () => {
    const res = await apiFetch(`/tables/${tableId}/disable-payment`, { method: 'PATCH' });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message || 'Ödeme kapatılamadı');
      return;
    }
    fetchAll();
  };

  const closeBill = async () => {
    const res = await apiFetch(`/tables/${tableId}/close-bill`, { method: 'PATCH' });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message || 'Hesap kapatılamadı');
      return;
    }
    fetchAll();
  };

  const cleanTable = async () => {
    const res = await apiFetch(`/tables/${tableId}/clean`, { method: 'PATCH' });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message || 'Masa temizlenemedi');
      return;
    }
    navigate('/tables');
  };

  const cancelSplit = async () => {
    const res = await apiFetch(`/payments/table/${tableId}/cancel-split`, { method: 'PATCH' });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message || 'Split iptal edilemedi');
      return;
    }
    fetchAll();
  };

  const settleRemaining = async (method) => {
    const res = await apiFetch(`/payments/table/${tableId}/manual-settlement`, {
      method: 'POST',
      body: JSON.stringify({ method }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message || 'Kapatma ödemesi başarısız');
      return;
    }
    fetchAll();
  };

  const manualCustom = async (method) => {
    const amount = Number(manualAmount || 0);
    if (!amount || amount <= 0) {
      setError('Geçerli tutar girin');
      return;
    }

    const res = await apiFetch(`/payments/table/${tableId}/manual-custom`, {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message || 'Özel tutar tahsilatı başarısız');
      return;
    }
    setManualAmount('');
    fetchAll();
  };

  const markSplitPaid = async (paymentId, method) => {
    const res = await apiFetch(`/payments/${paymentId}/manual`, {
      method: 'POST',
      body: JSON.stringify({ method }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message || 'Split payı tahsil edilemedi');
      return;
    }
    fetchAll();
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Yükleniyor...</div>;
  }

  if (!table) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Masa bulunamadı.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-emerald-400">{restaurant?.name || 'PayBite Store'}</p>
            <h1 className="mt-1 text-2xl font-bold">Masa {table.number}</h1>
            <p className="mt-1 text-sm text-slate-400">Session: {table.activeSessionId || 'Yok'} • Durum: {table.status}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/tables" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">Masalar</Link>
            {table.status === 'DIRTY' ? (
              <button onClick={cleanTable} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold">Masa Temizle</button>
            ) : null}
          </div>
        </div>

        {error ? <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

        <div className="mb-6 grid gap-3 md:grid-cols-5 text-sm">
          <div className="rounded-2xl bg-slate-900 p-4">Toplam<br /><strong>{money(bill?.totalOrders)}</strong></div>
          <div className="rounded-2xl bg-slate-900 p-4">Ödenen<br /><strong>{money(bill?.paidAmount)}</strong></div>
          <div className="rounded-2xl bg-slate-900 p-4">Kalan<br /><strong>{money(bill?.remaining)}</strong></div>
          <div className="rounded-2xl bg-slate-900 p-4">Ödeme<br /><strong>{table.paymentEnabled ? 'Açık' : 'Kapalı'}</strong></div>
          <div className="rounded-2xl bg-slate-900 p-4">Hesap<br /><strong>{table.billRequested ? 'İstendi' : 'Normal'}</strong></div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.2fr_0.9fr]">
          <section className="rounded-3xl bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Menü / Garson Siparişi</h2>
              <button onClick={createOrder} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950">
                Sipariş Gönder ({money(cartTotal)})
              </button>
            </div>
            <div className="space-y-4">
              {menu.map((category) => (
                <div key={category.id}>
                  <h3 className="mb-2 text-lg font-semibold">{category.name}</h3>
                  <div className="space-y-2">
                    {(category.items || []).map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-slate-400">{money(item.priceAmount)}</div>
                        </div>
                        <button onClick={() => addToCart(item)} className="rounded-xl border border-slate-700 px-3 py-1 text-sm">Ekle</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 ? (
              <div className="mt-4 space-y-2 rounded-2xl bg-slate-950 p-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{item.name}</span>
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg border border-slate-700 px-2" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button className="rounded-lg border border-slate-700 px-2" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Siparişler</h2>
              <div className="flex gap-2">
                <button onClick={table.paymentEnabled ? disablePayment : enablePayment} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">
                  {table.paymentEnabled ? 'Ödemeyi Kapat' : 'Ödemeyi Aç'}
                </button>
                <button onClick={closeBill} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">Hesabı Kapat</button>
              </div>
            </div>
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="rounded-2xl bg-slate-950 p-4 text-sm text-slate-400">Aktif sipariş yok.</div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="rounded-2xl bg-slate-950 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2 text-sm">
                      <strong>Sipariş #{order.id}</strong>
                      <span>{order.status}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {(order.items || []).map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2">
                          <span>{item.nameSnapshot} × {item.quantity}</span>
                          <span>{money(item.lineTotalAmount)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'].map((status) => (
                        <button key={status} onClick={() => updateOrderStatus(order.id, status)} className="rounded-xl border border-slate-700 px-3 py-1 text-xs font-semibold">
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl bg-slate-900 p-5">
            <h2 className="mb-4 text-xl font-bold">Tahsilat</h2>
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-950 p-4">
                <div className="mb-2 font-semibold">Manuel özel tutar</div>
                <div className="flex gap-2">
                  <input
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 outline-none"
                    placeholder="Tutar"
                  />
                  <button onClick={() => manualCustom('CASH')} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold">Nakit</button>
                  <button onClick={() => manualCustom('POS')} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold">POS</button>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 p-4">
                <div className="mb-2 font-semibold">Kalanı tek seferde kapat</div>
                <div className="flex gap-2">
                  <button onClick={() => settleRemaining('CASH')} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">Nakit</button>
                  <button onClick={() => settleRemaining('POS')} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">POS</button>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="font-semibold">Aktif split payları</div>
                  {splits.length > 0 ? <button onClick={cancelSplit} className="rounded-xl border border-red-500 px-3 py-1 text-xs font-semibold text-red-300">Split İptal</button> : null}
                </div>
                {splits.length === 0 ? (
                  <div className="text-sm text-slate-400">Aktif split yok.</div>
                ) : (
                  <div className="space-y-2">
                    {splits.map((split) => (
                      <div key={split.id} className="rounded-xl bg-slate-900 px-3 py-3 text-sm">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span>Split Ödeme #{split.id}</span>
                          <strong>{money(split.amount)}</strong>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => markSplitPaid(split.id, 'CASH')} className="rounded-lg border border-slate-700 px-3 py-1">Nakit</button>
                          <button onClick={() => markSplitPaid(split.id, 'POS')} className="rounded-lg border border-slate-700 px-3 py-1">POS</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TableDetail;
