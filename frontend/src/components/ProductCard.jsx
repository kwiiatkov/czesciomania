import { useAuth } from '../hooks/useAuth.jsx';
import { useCart } from '../hooks/useCart.jsx';

const S = {
  card: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer',
    transition: 'transform .2s, box-shadow .2s, border-color .2s',
    display: 'flex', flexDirection: 'column',
  },
  imgWrap: {
    background: 'var(--bg3)', aspectRatio: '4/3',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  },
  brand: {
    position: 'absolute', top: '.6rem', left: '.6rem',
    fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
    background: 'rgba(0,212,255,0.15)', color: 'var(--accent)',
    border: '1px solid rgba(0,212,255,0.25)',
    padding: '.2rem .55rem', borderRadius: '5px',
  },
  tagsWrap: {
    position: 'absolute', top: '.6rem', right: '.6rem',
    display: 'flex', flexDirection: 'column', gap: '.3rem',
  },
  tag: (name) => {
    const map = {
      'Bestseller': { bg: 'rgba(234,179,8,0.2)', c: '#facc15', border: 'rgba(234,179,8,0.3)' },
      'Nowość':     { bg: 'rgba(34,197,94,0.2)', c: '#4ade80', border: 'rgba(34,197,94,0.3)' },
      'Premium':    { bg: 'rgba(168,85,247,0.2)', c: '#c084fc', border: 'rgba(168,85,247,0.3)' },
      'Promocja':   { bg: 'rgba(239,68,68,0.2)', c: '#f87171', border: 'rgba(239,68,68,0.3)' },
    };
    const t = map[name] || { bg: 'rgba(255,255,255,0.07)', c: 'var(--text2)', border: 'var(--border)' };
    return {
      fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
      background: t.bg, color: t.c, border: `1px solid ${t.border}`,
      padding: '.18rem .45rem', borderRadius: '4px',
    };
  },
  gearSvg: { width: 48, height: 48, opacity: .25 },
  body: { padding: '.85rem 1rem 1rem', display: 'flex', flexDirection: 'column', flex: 1 },
  category: { fontSize: '.7rem', fontWeight: 500, color: 'var(--text3)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.05em' },
  name: { fontSize: '.88rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, flex: 1, marginBottom: '.75rem' },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' },
  price: { fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)' },
  addBtn: (outOfStock) => ({
    background: outOfStock ? 'rgba(255,255,255,0.05)' : 'var(--accent)',
    color: outOfStock ? 'var(--text3)' : '#070b13',
    border: 'none', borderRadius: '8px',
    padding: '.42rem .85rem', fontSize: '.8rem', fontWeight: 700,
    cursor: outOfStock ? 'not-allowed' : 'pointer',
    transition: 'opacity .2s, transform .15s',
    whiteSpace: 'nowrap',
  }),
};

const GearIcon = () => (
  <svg style={S.gearSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

export default function ProductCard({ produkt, onOpen, setToast, navigate }) {
  const { user } = useAuth();
  const { dodaj } = useCart();
  const outOfStock = produkt.stan_magazynowy === 0;

  async function handleAdd(e) {
    e.stopPropagation();
    if (outOfStock) return;
    if (!user) { navigate('login'); return; }
    try {
      await dodaj(produkt.id, 1);
      setToast(`${produkt.nazwa.substring(0, 30)} — dodano!`);
    } catch (err) {
      setToast('Błąd: ' + err.message);
    }
  }

  return (
    <div
      style={S.card}
      onClick={() => onOpen(produkt)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={S.imgWrap}>
        <div style={S.brand}>{produkt.producent}</div>
        {produkt.tagi?.length > 0 && (
          <div style={S.tagsWrap}>
            {produkt.tagi.slice(0, 2).map(t => <span key={t} style={S.tag(t)}>{t}</span>)}
          </div>
        )}
        <GearIcon />
      </div>

      <div style={S.body}>
        <div style={S.category}>{produkt.kategoria}</div>
        <div style={S.name}>{produkt.nazwa}</div>
        <div style={S.footer}>
          <span style={S.price}>
            {Number(produkt.cena_brutto).toFixed(2)} zł
          </span>
          <button
            style={S.addBtn(outOfStock)}
            onClick={handleAdd}
          >
            {outOfStock ? 'Brak' : '+ Koszyk'}
          </button>
        </div>
      </div>
    </div>
  );
}
