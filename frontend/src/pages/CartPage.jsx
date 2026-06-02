import { useCart } from '../hooks/useCart.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { zamowieniaApi } from '../api/index.js';
import { useState } from 'react';

const S = {
  page: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.5rem' },
  empty: { textAlign: 'center', padding: '4rem', color: 'var(--text3)' },
  emptyIcon: { fontSize: '3rem', marginBottom: '1rem' },
  item: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '.75rem',
  },
  itemName: { flex: 1, fontSize: '.9rem', fontWeight: 600 },
  itemBrand: { fontSize: '.75rem', color: 'var(--accent)', marginBottom: '.2rem' },
  qtyWrap: { display: 'flex', alignItems: 'center', gap: '.4rem' },
  qtyBtn: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '6px', width: '28px', height: '28px',
    fontSize: '.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  qtyNum: { minWidth: '28px', textAlign: 'center', fontWeight: 700 },
  price: { fontWeight: 800, color: 'var(--accent)', minWidth: '80px', textAlign: 'right' },
  deleteBtn: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
    color: 'var(--red)', borderRadius: '7px', width: '32px', height: '32px',
    fontSize: '.9rem', cursor: 'pointer',
  },
  summary: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '1.5rem', marginTop: '1.5rem',
  },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: '.6rem', fontSize: '.9rem' },
  total: { display: 'flex', justifyContent: 'space-between', marginTop: '.75rem', paddingTop: '.75rem', borderTop: '1px solid var(--border)', fontWeight: 800, fontSize: '1.15rem' },
  orderBtn: (loading) => ({
    width: '100%', marginTop: '1rem', padding: '.9rem',
    background: loading ? 'rgba(0,212,255,0.5)' : 'var(--accent)',
    color: '#070b13', border: 'none', borderRadius: '10px',
    fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
  }),
  promoWrap: { display: 'flex', gap: '.5rem', marginBottom: '1rem' },
  promoInput: { flex: 1 },
  promoBtn: {
    background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
    color: 'var(--accent)', borderRadius: '8px', padding: '.6rem 1rem',
    fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  success: { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', borderRadius: '8px', padding: '.7rem 1rem', fontSize: '.85rem', marginBottom: '1rem' },
};

const DELIVERY = 15.00;

export default function CartPage({ navigate, setToast }) {
  const { items, zmienIlosc, usun, suma, count, wyczysc } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [kodRabatowy, setKodRabatowy] = useState('');
  const [applied, setApplied] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  if (!user) {
    return (
      <div style={S.page}>
        <div style={S.empty}>
          <div style={S.emptyIcon}>🔒</div>
          <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>Zaloguj się, aby zobaczyć koszyk</div>
          <button onClick={() => navigate('login')} style={{ marginTop: '1rem', background: 'var(--accent)', color: '#070b13', border: 'none', borderRadius: '10px', padding: '.7rem 1.5rem', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Zaloguj się
          </button>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div style={S.page}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '.5rem' }}>Zamówienie złożone!</div>
          <div style={{ color: 'var(--text3)', marginBottom: '1.5rem' }}>Nr zamówienia: #{orderSuccess}</div>
          <button onClick={() => navigate('orders')} style={{ background: 'var(--accent)', color: '#070b13', border: 'none', borderRadius: '10px', padding: '.7rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Moje zamówienia
          </button>
        </div>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div style={S.page}>
        <div style={S.empty}>
          <div style={S.emptyIcon}>🛒</div>
          <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>Koszyk jest pusty</div>
          <button onClick={() => navigate('shop')} style={{ marginTop: '1rem', background: 'var(--accent)', color: '#070b13', border: 'none', borderRadius: '10px', padding: '.7rem 1.5rem', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Wróć do sklepu
          </button>
        </div>
      </div>
    );
  }

  async function handleOrder() {
    setLoading(true);
    try {
      const res = await zamowieniaApi.zloz({ kod_rabatowy: applied ? kodRabatowy : undefined });
      setOrderSuccess(res.zamowienie_id);
    } catch (err) {
      setToast('Błąd: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const dostawaGratis = suma >= 300;
  const dostawa = dostawaGratis ? 0 : DELIVERY;
  const razem = suma + dostawa;

  return (
    <div style={S.page}>
      <div style={S.title}>Koszyk ({count} szt.)</div>

      {items.map(item => (
        <div key={item.id} style={S.item}>
          <div style={{ flex: 1 }}>
            <div style={S.itemBrand}>{item.producent}</div>
            <div style={S.itemName}>{item.nazwa}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{item.sku}</div>
          </div>
          <div style={S.qtyWrap}>
            <button style={S.qtyBtn} onClick={() => item.ilosc > 1 ? zmienIlosc(item.id, item.ilosc - 1) : usun(item.id)}>−</button>
            <span style={S.qtyNum}>{item.ilosc}</span>
            <button style={S.qtyBtn} onClick={() => zmienIlosc(item.id, item.ilosc + 1)} disabled={item.ilosc >= item.stan_magazynowy}>+</button>
          </div>
          <div style={S.price}>{(item.cena_brutto * item.ilosc).toFixed(2)} zł</div>
          <button style={S.deleteBtn} onClick={() => usun(item.id)}>✕</button>
        </div>
      ))}

      <div style={S.summary}>
        <div style={S.promoWrap}>
          <input style={S.promoInput} placeholder="Kod rabatowy..." value={kodRabatowy} onChange={e => { setKodRabatowy(e.target.value); setApplied(false); }} />
          <button style={S.promoBtn} onClick={() => setApplied(true)}>Zastosuj</button>
        </div>
        {applied && <div style={S.success}>✓ Kod zostanie zastosowany przy składaniu zamówienia</div>}

        <div style={S.row}><span>Produkty</span><span>{suma.toFixed(2)} zł</span></div>
        <div style={S.row}>
          <span>Dostawa</span>
          <span style={dostawaGratis ? { color: 'var(--success)' } : {}}>
            {dostawaGratis ? 'GRATIS' : `${dostawa.toFixed(2)} zł`}
          </span>
        </div>
        {!dostawaGratis && <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: '.5rem' }}>Brakuje {(300 - suma).toFixed(2)} zł do darmowej dostawy</div>}

        <div style={S.total}><span>Do zapłaty</span><span style={{ color: 'var(--accent)' }}>{razem.toFixed(2)} zł</span></div>

        <button style={S.orderBtn(loading)} onClick={handleOrder} disabled={loading}>
          {loading ? 'Składanie zamówienia...' : 'Złóż zamówienie'}
        </button>
      </div>
    </div>
  );
}
