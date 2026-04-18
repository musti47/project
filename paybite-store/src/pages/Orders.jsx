import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const res = await fetch(`${API_URL}/orders`);
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'] });

    fetchOrders();

    socket.onAny((event) => {
      if (event.startsWith('table-')) {
        fetchOrders();
      }
    });

    return () => socket.disconnect();
  }, []);

  const groupedOrders = useMemo(() => {
    const map = {};

    for (const order of orders) {
      const tableId = order.table?.id || order.tableId;
      const tableNumber = order.table?.number || tableId || 'Bilinmiyor';

      if (!map[tableId]) {
        map[tableId] = {
          tableId,
          tableNumber,
          orders: [],
        };
      }

      map[tableId].orders.push(order);
    }

    return Object.values(map);
  }, [orders]);

  const updateStatus = async (orderId, status) => {
    const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.message || 'Sipariş durumu güncellenemedi');
      return;
    }

    await fetchOrders();
  };

  const approveAllForTable = async (tableOrders) => {
    for (const order of tableOrders) {
      if (order.status === 'OPEN') {
        await fetch(`${API_URL}/orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CONFIRMED' }),
        });
      }
    }

    await fetchOrders();
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Sipariş Akışı</h1>
          <p className="mt-1 text-sm text-slate-400">
            Masalara göre gruplanmış aktif siparişler
          </p>
        </div>

        {groupedOrders.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Henüz sipariş yok
          </div>
        ) : (
          <div className="space-y-6">
            {groupedOrders.map((group) => (
              <section
                key={group.tableId}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">Masa {group.tableNumber}</h2>
                    <p className="text-sm text-slate-400">
                      Toplam sipariş: {group.orders.length}
                    </p>
                  </div>

                  <button
                    onClick={() => approveAllForTable(group.orders)}
                    className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950"
                  >
                    Hepsini Onayla
                  </button>
                </div>

                <div className="space-y-3">
                  {group.orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl bg-slate-800 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">Sipariş #{order.id}</div>
                          <div className="text-xs text-slate-400">
                            {order.items?.length || 0} ürün • {order.totalAmount} ₺
                          </div>
                        </div>

                        <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold">
                          {order.status}
                        </span>
                      </div>

                      <div className="mb-4 space-y-1 text-sm text-slate-300">
                        {order.items?.map((item) => (
                          <div key={item.id}>
                            {item.menuItem?.name} x {item.quantity}
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => updateStatus(order.id, 'CONFIRMED')}
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold"
                        >
                          Onayla
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, 'PREPARING')}
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold"
                        >
                          Hazırlanıyor
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, 'READY')}
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold"
                        >
                          Hazır
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, 'DELIVERED')}
                          className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950"
                        >
                          Teslim
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, 'CANCELLED')}
                          className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;