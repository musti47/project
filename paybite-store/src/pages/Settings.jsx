import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function Settings() {
  const [settings, setSettings] = useState(null);
  const [delay, setDelay] = useState(1);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    const res = await apiFetch('/restaurants/me/settings');
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.message || 'Ayarlar alınamadı');
      return;
    }

    setSettings(data || {});
    setDelay(data?.kitchenPrintDelayMinutes ?? 1);
  };

  const updateSettings = async (newData) => {
    const res = await apiFetch('/restaurants/me/settings', {
      method: 'PATCH',
      body: JSON.stringify(newData),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.message || 'Ayar güncellenemedi');
      return;
    }

    setError('');
    setSettings(data || {});
    setDelay(data?.kitchenPrintDelayMinutes ?? delay);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (!settings) {
    return <div className="min-h-screen bg-slate-950 p-6 text-white">Yükleniyor...</div>;
  }

  const toggles = [
    ['splitEnabled', 'Hesap bölme'],
    ['customerCustomAmountEnabled', 'Müşteri özel tutar'],
    ['waiterCustomAmountEnabled', 'Garson özel tutar'],
    ['fullSettlementEnabled', 'Tam kapatma'],
    ['billRequestEnabled', 'Hesap isteme'],
    ['manualCashEnabled', 'Nakit'],
    ['manualPosEnabled', 'POS'],
    ['kitchenPrintEnabled', 'Mutfak fişi'],
    ['requireWaiterApprovalForKitchenPrint', 'Fiş için garson onayı'],
    ['cleaningFlowEnabled', 'Temizlik akışı'],
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Restoran Ayarları</h1>
            <p className="mt-1 text-sm text-slate-400">Tüm ödeme ve lifecycle kuralları backend tarafında da enforce edilir.</p>
          </div>
          <Link to="/tables" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">
            Masalara Dön
          </Link>
        </div>

        {error ? <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2">
          {toggles.map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-2xl bg-slate-900 p-4">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={!!settings[key]}
                onChange={(e) => updateSettings({ [key]: e.target.checked })}
              />
            </label>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-900 p-4">
          <div className="mb-2 font-semibold">Mutfak fişi gecikme süresi (dakika)</div>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none"
            />
            <button
              onClick={() => updateSettings({ kitchenPrintDelayMinutes: Number(delay || 0) })}
              className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
