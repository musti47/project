import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:3000/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          window.location.href = '/tables';
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.token) {
        alert(data?.message || 'Giriş başarısız');
        return;
      }

      localStorage.setItem('token', data.token);
      window.location.href = '/tables';
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-emerald-400">PayBite POS</p>
          <h1 className="mt-1 text-2xl font-bold">Giriş Yap</h1>
          <p className="mt-2 text-sm text-slate-400">Garson paneline erişmek için hesabınızla giriş yapın.</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@paybite.com"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {submitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
