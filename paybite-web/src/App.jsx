import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;

const money = (value) => `${Number(value || 0).toLocaleString('tr-TR')} ₺`;

const createIdempotencyKey = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

function App() {
  const params = new URLSearchParams(window.location.search);
  const tableToken = params.get('tableToken') || params.get('token') || '';

  const [session, setSession] = useState(null);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bill, setBill] = useState(null);
  const [splits, setSplits] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [personCount, setPersonCount] = useState(2);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  useEffect(() => {
    console.log("SESSION:", session);
    console.log("BILL:", bill);
    console.log("PAYMENT ENABLED:", bill?.paymentEnabled);
    console.log("REMAINING:", bill?.remaining);
    console.log("BILL CLOSED:", bill?.billingMode);
  }, [session, bill]);
  const apiFetch = (path, options = {}) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });

  const refresh = async (sessionId, restaurantId) => {
    if (!sessionId) {
      console.log("⚠️ session yok → initialize");
      await initialize();
      return;
    }
    const [menuRes, ordersRes, billRes, splitsRes, sessionRes] = await Promise.all([
      apiFetch(`/menu?restaurantId=${restaurantId}`),
      apiFetch(`/orders/session/${sessionId}`),
      apiFetch(`/bill/session/${sessionId}`),
      apiFetch(`/payments/session/${sessionId}/pending-splits`),
      apiFetch(`/sessions/${sessionId}`),
    ]);

    const [menuData, ordersData, billData, splitsData, sessionData] = await Promise.all([
      menuRes.json().catch(() => null),
      ordersRes.json().catch(() => []),
      billRes.json().catch(() => null),
      splitsRes.json().catch(() => []),
      sessionRes.json().catch(() => null),
    ]);

    if (!ordersRes.ok || !billRes.ok || !sessionRes.ok) {
      throw new Error(
        ordersData?.message || billData?.message || sessionData?.message || 'Oturum verisi alınamadı',
      );
    }

    if (menuRes.ok) {
      setMenu(Array.isArray(menuData?.categories) ? menuData.categories : []);
    }
    setOrders(Array.isArray(ordersData) ? ordersData : []);
    setBill(billData);
    setSplits(Array.isArray(splitsData) ? splitsData : []);
    setSession((prev) => ({
      ...(prev || {}),
      ...(sessionData || {}),
      sessionId,
      restaurantId,
    }));
  };

  const initialize = async () => {
    if (!tableToken) {
      setError('QR bağlantısında masa tokenı bulunamadı.');
      setLoading(false);
      return;
    }

    try {
      setError('');

      // 🔥 1. çağrı
      let initRes = await apiFetch('/sessions/from-table-token', {
        method: 'POST',
        body: JSON.stringify({ token: tableToken }),
      });

      let initData = await initRes.json().catch(() => null);

      if (!initRes.ok || !initData?.token || !initData?.restaurantId) {
        throw new Error(initData?.message || 'Session başlatılamadı');
      }

      // 🔥 KRİTİK FIX
      if (initData.status === 'CLOSED') {
        console.log("🔁 session closed → recreate");

        initRes = await apiFetch('/sessions/from-table-token', {
          method: 'POST',
          body: JSON.stringify({ token: tableToken }),
        });

        initData = await initRes.json().catch(() => null);
      }

      setSession(initData);
      await refresh(initData.token, initData.restaurantId);

    } catch (err) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initialize();
  }, [tableToken]);

  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'] });

    socket.onAny(async (eventName, event) => {
      console.log("🔥 realtime:", eventName, event);

      if (event?.type === "SESSION_UPDATED") {
        await initialize();
        return;
      }

      await refresh(session?.sessionId || session?.token, session?.restaurantId);
    });

    return () => socket.disconnect();
  }, []); // 🔥 KRİTİK
  const activeSessionId = session?.sessionId || session?.token;
  const paymentEnabled = !!session?.table?.paymentEnabled;
  const billClosed =
    Number(bill?.totalOrders || 0) > 0 &&
    Number(bill?.remaining || 0) <= 0;
  const unpaidItems = useMemo(
    () =>
      orders.flatMap((order) =>
        (order.items || []).map((item) => ({
          ...item,
          orderId: order.id,
          orderStatus: order.status,
        })),
      ),
    [orders],
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.priceAmount * item.quantity, 0),
    [cart],
  );

  const selectedItemsTotal = useMemo(() => {
    const selectedSet = new Set(selectedItemIds);
    return unpaidItems
      .filter((item) => selectedSet.has(item.id))
      .reduce((sum, item) => sum + Number(item.lineTotalAmount || 0), 0);
  }, [selectedItemIds, unpaidItems]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((row) => row.id === item.id);
      if (existing) {
        return prev.map((row) => (row.id === item.id ? { ...row, quantity: row.quantity + 1 } : row));
      }
      return [...prev, { id: item.id, name: item.name, priceAmount: item.priceAmount, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId, nextQuantity) => {
    setCart((prev) =>
      prev
        .map((row) => (row.id === itemId ? { ...row, quantity: nextQuantity } : row))
        .filter((row) => row.quantity > 0),
    );
  };

  const submitAction = async (runner) => {
    if (!activeSessionId || busy) return;
    try {
      setBusy(true);
      setError('');
      await runner();
      await refresh(activeSessionId, session.restaurantId);
    } catch (err) {
      setError(err.message || 'İşlem başarısız');
    } finally {
      setBusy(false);
    }
  };

  const sendOrder = async () => {
    if (cart.length === 0) {
      setError('Sepet boş');
      return;
    }

    await submitAction(async () => {
      const res = await apiFetch('/orders/customer', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: activeSessionId,
          idempotencyKey: createIdempotencyKey('order'),
          items: cart.map((item) => ({
            menuItemId: item.id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Sipariş gönderilemedi');
      }
      setCart([]);
    });
  };

  const requestBill = async () => {
    await submitAction(async () => {
      const res = await apiFetch('/tables/public/request-bill', {
        method: 'POST',
        body: JSON.stringify({ sessionId: activeSessionId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Hesap istenemedi');
      }
    });
  };

  const payCustom = async () => {
    const amount = Math.round(Number(customAmount || 0));
    if (!amount || amount <= 0) {
      setError('Geçerli bir tutar girin');
      return;
    }

    await submitAction(async () => {
      const res = await apiFetch('/payments/customer/custom', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: activeSessionId,
          amount,
          idempotencyKey: createIdempotencyKey('payment_custom'),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Ödeme başarısız');
      }
      setCustomAmount('');
    });
  };

  const paySelectedItems = async () => {
    if (selectedItemIds.length === 0) {
      setError('Ürün seçin');
      return;
    }

    await submitAction(async () => {
      const res = await apiFetch('/payments/customer/items', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: activeSessionId,
          itemIds: selectedItemIds,
          idempotencyKey: createIdempotencyKey('payment_items'),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Ürün bazlı ödeme başarısız');
      }
      setSelectedItemIds([]);
    });
  };

  const createSplit = async () => {
    await submitAction(async () => {
      const res = await apiFetch('/payments/customer/split/equal', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: activeSessionId,
          personCount: Number(personCount || 2),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Hesap bölünemedi');
      }
    });
  };

  const paySplit = async (paymentId) => {
    await submitAction(async () => {
      const res = await apiFetch(`/payments/customer/split/${paymentId}/pay`, {
        method: 'POST',
        body: JSON.stringify({ sessionId: activeSessionId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Split ödemesi başarısız');
      }
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-emerald-400">PayBite QR</p>
          <h1 className="mt-1 text-2xl font-bold">
            {session?.table?.number ? `Masa ${session.table.number}` : 'Müşteri Paneli'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            QR masa kimliği sabit, işlem yapan aktif session ise geçicidir. Tüm kritik doğrulamalar backend tarafında yapılır.
          </p>
          {bill ? (
            <div className="mt-4 grid gap-3 md:grid-cols-4 text-sm">
              <div className="rounded-2xl bg-slate-950 p-3">Toplam<br /><strong>{money(bill.totalOrders)}</strong></div>
              <div className="rounded-2xl bg-slate-950 p-3">Ödenen<br /><strong>{money(bill.paidAmount)}</strong></div>
              <div className="rounded-2xl bg-slate-950 p-3">Kalan<br /><strong>{money(bill.remaining)}</strong></div>
              <div className="rounded-2xl bg-slate-950 p-3">Ödeme Durumu<br /><strong>{paymentEnabled ? 'Açık' : 'Kapalı'}</strong></div>
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        {!session && !loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Session başlatılamadı.</div>
        ) : null}

        {session ? (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">Menü</h2>
                    <p className="text-sm text-slate-400">Siparişler aktif session üzerine yazılır.</p>
                  </div>
                  <button
                    onClick={sendOrder}
                    disabled={busy || cart.length === 0 || billClosed}
                    className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50"
                  >
                    Siparişi Gönder ({money(cartTotal)})
                  </button>
                </div>
                <div className="space-y-4">
                  {menu.map((category) => (
                    <div key={category.id}>
                      <h3 className="mb-2 text-lg font-semibold">{category.name}</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {(category.items || []).map((item) => (
                          <div key={item.id} className="rounded-2xl bg-slate-950 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold">{item.name}</p>
                                {item.description ? <p className="mt-1 text-sm text-slate-400">{item.description}</p> : null}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{money(item.priceAmount)}</p>
                                <button
                                  onClick={() => addToCart(item)}
                                  disabled={busy || billClosed}
                                  className="mt-2 rounded-xl border border-slate-700 px-3 py-1 text-sm disabled:opacity-40"
                                >
                                  Ekle
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">Açık Siparişler</h2>
                    <p className="text-sm text-slate-400">Ödenmiş ürünler backend tarafından gizlenir.</p>
                  </div>
                  <button
                    onClick={requestBill}
                    disabled={busy || billClosed || !!session?.table?.billRequested}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    {session?.table?.billRequested ? 'Hesap İstendi' : 'Hesap İste'}
                  </button>
                </div>
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <div className="rounded-2xl bg-slate-950 p-4 text-sm text-slate-400">Henüz aktif sipariş yok.</div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="rounded-2xl bg-slate-950 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2 text-sm">
                          <strong>Sipariş #{order.id}</strong>
                          <span className="text-slate-400">{order.status}</span>
                        </div>
                        <div className="space-y-2">
                          {(order.items || []).map((item) => (
                            <label key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2 text-sm">
                              <div>
                                <div className="font-medium">{item.nameSnapshot} × {item.quantity}</div>
                                {item.note ? <div className="text-slate-400">Not: {item.note}</div> : null}
                              </div>
                              <div className="flex items-center gap-3">
                                <span>{money(item.lineTotalAmount)}</span>
                                <input
                                  type="checkbox"
                                  checked={selectedItemIds.includes(item.id)}
                                  disabled={!paymentEnabled || busy || splits.length > 0 || billClosed}
                                  onChange={(e) =>
                                    setSelectedItemIds((prev) =>
                                      e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id),
                                    )
                                  }
                                />
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="mb-4 text-xl font-bold">Sepet</h2>
                <div className="space-y-3">
                  {cart.length === 0 ? (
                    <div className="rounded-2xl bg-slate-950 p-4 text-sm text-slate-400">Sepetiniz boş.</div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-slate-950 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-sm text-slate-400">{money(item.priceAmount)} / adet</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="rounded-lg border border-slate-700 px-3 py-1" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>-</button>
                            <span>{item.quantity}</span>
                            <button className="rounded-lg border border-slate-700 px-3 py-1" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>+</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="mb-4 text-xl font-bold">Ödeme</h2>
                {!paymentEnabled ? (
                  <div className="rounded-2xl bg-slate-950 p-4 text-sm text-slate-400">Garson ödeme almayı açtığında bu alan aktif olur.</div>
                ) : billClosed ? (
                  <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-300">Hesap kapanmış durumda.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-950 p-4">
                      <p className="mb-2 font-semibold">Özel tutar öde</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max={bill?.remaining || 0}
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 outline-none"
                          placeholder="Tutar"
                        />
                        <button onClick={payCustom} disabled={busy || splits.length > 0} className="rounded-xl bg-white px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">
                          Öde
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-950 p-4">
                      <p className="mb-2 font-semibold">Ürün bazlı ödeme</p>
                      <button onClick={paySelectedItems} disabled={busy || selectedItemIds.length === 0 || splits.length > 0} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold disabled:opacity-50">
                        Seçilen ürünleri öde ({money(selectedItemsTotal)})
                      </button>
                    </div>

                    <div className="rounded-2xl bg-slate-950 p-4">
                      <p className="mb-2 font-semibold">Eşit böl</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="2"
                          value={personCount}
                          onChange={(e) => setPersonCount(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 outline-none"
                        />
                        <button onClick={createSplit} disabled={busy || splits.length > 0} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold disabled:opacity-50">
                          Böl
                        </button>
                      </div>
                    </div>

                    {splits.length > 0 ? (
                      <div className="rounded-2xl bg-slate-950 p-4">
                        <p className="mb-3 font-semibold">Bekleyen split ödemeleri</p>
                        <div className="space-y-2">
                          {splits.map((split) => (
                            <div key={split.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2 text-sm">
                              <span>Pay #{split.id}</span>
                              <div className="flex items-center gap-3">
                                <span>{money(split.amount)}</span>
                                <button onClick={() => paySplit(split.id)} disabled={busy} className="rounded-lg bg-emerald-500 px-3 py-1 font-semibold text-slate-950 disabled:opacity-50">
                                  Bu payı öde
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
