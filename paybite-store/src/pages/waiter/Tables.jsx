import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL;
const money = (value) => `${Number(value || 0).toLocaleString('tr-TR')} ₺`;

function Tables() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    const [tablesRes, meRes] = await Promise.all([apiFetch('/tables'), apiFetch('/auth/me')]);
    const [tablesData, meData] = await Promise.all([
      tablesRes.json().catch(() => []),
      meRes.json().catch(() => null),
    ]);

    if (!tablesRes.ok || !meRes.ok) {
      setError(tablesData?.message || meData?.message || 'Veriler alınamadı');
      setLoading(false);
      return;
    }

    setTables(Array.isArray(tablesData) ? tablesData : []);
    setProfile(meData);
    setError('');
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'] });
    socket.onAny((event) => {
      if (event.startsWith('table-')) {
        fetchAll();
      }
    });
    return () => socket.disconnect();
  }, []);

  const openTable = async (tableId) => {
    const res = await apiFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({ tableId }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.message || 'Masa açılamadı');
      return;
    }

    fetchAll();
    navigate(`/table/${tableId}`);
  };

  const cleanTable = async (tableId) => {
    const res = await apiFetch(`/tables/${tableId}/clean`, { method: 'PATCH' });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message || 'Masa temizlenemedi');
      return;
    }
    fetchAll();
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-emerald-400">PayBite Store</p>
            <h1 className="mt-1 text-2xl font-bold">{profile?.restaurant?.name || 'Masa Kontrol'}</h1>
            <p className="mt-1 text-sm text-slate-400">Aktif session, ödeme ve hesap lifecycle durumu tek ekranda.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/settings" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">Ayarlar</Link>
            <Link to="/admin/tables" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">Masa Yönetimi</Link>
          </div>
        </div>

        {error ? <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <div key={table.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Masa {table.number}</h2>
                  <p className="text-sm text-slate-400">Durum: {table.status}</p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold">{table.paymentEnabled ? 'Ödeme Açık' : 'Ödeme Kapalı'}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-950 p-3">Toplam<br /><strong>{money(table.totalAmount)}</strong></div>
                <div className="rounded-2xl bg-slate-950 p-3">Kalan<br /><strong>{money(table.remainingAmount)}</strong></div>
                <div className="rounded-2xl bg-slate-950 p-3">Session<br /><strong>{table.activeSessionId ? 'Açık' : 'Yok'}</strong></div>
                <div className="rounded-2xl bg-slate-950 p-3">Hesap<br /><strong>{table.billRequested ? 'İstendi' : 'Beklemede'}</strong></div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {table.status === 'AVAILABLE' ? (
                  <button onClick={() => openTable(table.id)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950">
                    Masayı Aç
                  </button>
                ) : null}
                {table.status === 'OCCUPIED' ? (
                  <button onClick={() => navigate(`/table/${table.id}`)} className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold">
                    Detaya Git
                  </button>
                ) : null}
                {table.status === 'DIRTY' ? (
                  <button onClick={() => cleanTable(table.id)} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold">
                    Temizle
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Tables;
