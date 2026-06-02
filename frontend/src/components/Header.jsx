import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useCart } from '../hooks/useCart.jsx';

const S = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(7,11,19,0.92)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center',
    padding: '0 2rem', height: '64px', gap: '2rem',
  },
  logo: {
    fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-.03em',
    background: 'none', border: 'none', color: 'inherit', cursor: 'pointer',
    flexShrink: 0,
  },
  searchWrap: {
    flex: 1, maxWidth: '480px', position: 'relative',
  },
  searchInput: {
    padding: '.55rem 1rem .55rem 2.5rem',
    borderRadius: '8px',
  },
  searchIcon: {
    position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text3)', fontSize: '.9rem', pointerEvents: 'none',
  },
  right: { display: 'flex', alignItems: 'center', gap: '.75rem', marginLeft: 'auto' },
  navBtn: (active) => ({
    background: active ? 'rgba(0,212,255,0.1)' : 'none',
    border: active ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
    color: active ? 'var(--accent)' : 'var(--text2)',
    borderRadius: '8px', padding: '.45rem .9rem',
    fontSize: '.85rem', fontWeight: 600,
    transition: 'all .2s', cursor: 'pointer',
  }),
  cartBtn: {
    position: 'relative',
    background: 'rgba(0,212,255,0.12)',
    border: '1px solid rgba(0,212,255,0.3)',
    color: 'var(--accent)', borderRadius: '8px',
    padding: '.45rem .9rem', fontSize: '.85rem', fontWeight: 700,
    display: 'flex', alignItems: 'center', gap: '.4rem',
    cursor: 'pointer',
  },
  badge: {
    background: 'var(--red)', color: '#fff',
    fontSize: '.65rem', fontWeight: 800,
    borderRadius: '50%', width: '18px', height: '18px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'absolute', top: '-6px', right: '-6px',
  },
};

export default function Header({ page, navigate, onSearch }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [q, setQ] = useState('');

  function handleSearch(e) {
    const val = e.target.value;
    setQ(val);
    onSearch(val);
  }

  return (
    <nav style={S.nav}>
      <button style={S.logo} onClick={() => navigate('shop')}>
        <span style={{ color: 'var(--accent)' }}>Części</span>omania
      </button>

      <div style={S.searchWrap}>
        <span style={S.searchIcon}>⚙</span>
        <input
          style={S.searchInput}
          placeholder="Szukaj części, marki, SKU..."
          value={q}
          onChange={handleSearch}
          onFocus={() => navigate('shop')}
        />
      </div>

      <div style={S.right}>
        <button style={S.navBtn(page === 'shop')} onClick={() => navigate('shop')}>Sklep</button>

        {user ? (
          <>
            <button style={S.navBtn(page === 'account')} onClick={() => navigate('account')}>
              Konto
            </button>
            <button style={S.navBtn(page === 'orders')} onClick={() => navigate('orders')}>
              Zamówienia
            </button>
            <button style={{ ...S.navBtn(false), color: 'var(--text3)' }} onClick={logout}>
              Wyloguj
            </button>
          </>
        ) : (
          <button style={S.navBtn(page === 'login')} onClick={() => navigate('login')}>
            Zaloguj się
          </button>
        )}

        <button style={S.cartBtn} onClick={() => navigate('cart')}>
          🛒 Koszyk
          {count > 0 && <span style={S.badge}>{count}</span>}
        </button>
      </div>
    </nav>
  );
}
