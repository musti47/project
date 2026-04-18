import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

function TablesAdmin() {
  const [tables, setTables] = useState([]);
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');

  const fetchTables = async () => {
    const res = await apiFetch('/tables');
    const data = await res.json().catch(() => []);

    if (!res.ok) {
      setError(data?.message || 'Masalar alınamadı');
      return;
    }

    setTables(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const createTable = async (event) => {
    event.preventDefault();
    setError('');

    const res = await apiFetch('/tables', {
      method: 'POST',
      body: JSON.stringify({ number: Number(number) }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.message || 'Masa oluşturulamadı');
      return;
    }

    setNumber('');
    fetchTables();
  };

  const deleteTable = async (id) => {
    const res = await apiFetch(`/tables/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.message || 'Masa silinemedi');
      return;
    }

    fetchTables();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Masa Yönetimi</h1>
            <p className="mt-1 text-sm text-slate-400">QR token kalıcıdır, session ise masa kullanımı başladığında oluşur.</p>
          </div>
          <Link to="/tables" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">
            Masalara Dön
          </Link>
        </div>

        {error ? <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

        <form onSubmit={createTable} className="mb-6 flex gap-3 rounded-3xl bg-slate-900 p-5">
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Masa numarası"
            type="number"
            min="1"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
          />
          <button className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950">Ekle</button>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {tables.map((table) => (
            <div key={table.id} className="rounded-3xl bg-slate-900 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Masa {table.number}</h2>
                  <p className="text-sm text-slate-400 break-all">QR Token: {table.token}</p>
                </div>
                <button onClick={() => deleteTable(table.id)} className="rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TablesAdmin;
