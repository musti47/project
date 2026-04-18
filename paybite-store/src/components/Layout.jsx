import { Link, Outlet, useLocation } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tables', label: 'Masalar' },
  { to: '/menu', label: 'Menü' },
  { to: '/orders', label: 'Siparişler' },
  { to: '/payments', label: 'Ödemeler' },
];

function Layout() {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      
      <aside style={{ width: 220, background: '#111', color: '#fff', padding: 20 }}>
        <h2>PayBite</h2>

        {links.map((link) => (
          <div key={link.to} style={{ marginTop: 10 }}>
            <Link
              to={link.to}
              style={{
                color: '#fff',
                textDecoration: 'none',
                background: location.pathname === link.to ? '#333' : 'transparent',
                padding: 10,
                display: 'block',
                borderRadius: 6,
              }}
            >
              {link.label}
            </Link>
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, padding: 20 }}>
        <Outlet />
      </main>

    </div>
  );
}

export default Layout;