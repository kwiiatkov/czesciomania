import { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import ShopPage from './pages/ShopPage.jsx';
import CartPage from './pages/CartPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
// w JSX:


const S = {
  toast: {
    position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 999,
    background: 'var(--bg2)', border: '1px solid rgba(34,197,94,0.3)',
    color: '#4ade80', borderRadius: '10px',
    padding: '.75rem 1.25rem', fontSize: '.88rem', fontWeight: 600,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    animation: 'slideUp .3s ease both',
    maxWidth: '320px',
  },
};

export default function App() {
  const [page, setPage] = useState('shop');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  function navigate(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div>
      <Header
        page={page}
        navigate={navigate}
        onSearch={q => { setSearchQuery(q); setPage('shop'); }}
      />

      {page === 'shop'    && <ShopPage    searchQuery={searchQuery} setToast={setToast} navigate={navigate} />}
      {page === 'cart'    && <CartPage    setToast={setToast} navigate={navigate} />}
      {page === 'login'   && <LoginPage   navigate={navigate} />}
      {page === 'account' && <AccountPage navigate={navigate} />}
      {page === 'orders'  && <AccountPage navigate={navigate} defaultTab="orders" />}
      {page === 'admin' && <AdminPage navigate={navigate} />}

      {toast && <div style={S.toast}>✓ {toast}</div>}
    </div>
  );
}
