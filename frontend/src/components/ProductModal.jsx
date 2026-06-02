import { useState, useEffect } from 'react';
import { produktyApi } from '../api/index.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useCart } from '../hooks/useCart.jsx';

const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '16px', width: '100%', maxWidth: '700px',
    maxHeight: '90vh', overflow: 'auto',
    animation: 'slideUp .3s ease both',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '1.5rem', borderBottom: '1px solid var(--border)', gap: '1rem',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)',
    color: 'var(--text2)', borderRadius: '8px', width: '32px', height: '32px',
    fontSize: '1.1rem', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  body: { padding: '1.5rem' },
  producer: { fontSize: '.72rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.4rem' },
  title: { fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '.75rem' },
  price: { fontSize: '2rem', fontWeight: 900, color: 'var(--accent)', marginBottom: '1rem' },
  sku: { fontSize: '.78rem', color: 'var(--text3)', marginBottom: '1rem' },
  desc: { fontSize: '.88rem', color: 'var(--text2)', lineHeight: 1.65, marginBottom: '1.25rem' },
  section: { marginBottom: '1.25rem' },
  sectionTitle: { fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.6rem' },
  attrsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem' },
  attr: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '.4rem .7rem', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '7px', fontSize: '.82rem',
  },
  attrKey: { color: 'var(--text3)' },
  attrVal: { color: 'var(--text)', fontWeight: 600 },
  vehicleList: { display: 'flex', flexWrap: 'wrap', gap: '.4rem' },
  vehicleTag: {
    background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
    borderRadius: '6px', padding: '.3rem .6rem', fontSize: '.78rem', color: 'var(--text2)',
  },
  footer: {
    padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: '1rem',
  },
  addBtn: (disabled) => ({
    flex: 1, background: disabled ? 'rgba(255,255,255,0.06)' : 'var(--accent)',
    color: disabled ? 'var(--text3)' : '#070b13',
    border: 'none', borderRadius: '10px', padding: '.8rem',
    fontSize: '1rem', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
  }),
};

export default function ProductModal({ produkt, onClose, setToast, navigate }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { dodaj } = useCart();

  useEffect(() => {
    setLoading(true);
    produktyApi.szczegoly(produkt.id)
      .then(d => setDetails(d))
      .catch(() => setDetails(produkt))
      .finally(() => setLoading(false));
  }, [produkt.id]);

  async function handleAdd() {
    if (!user) { navigate('login'); onClose(); return; }
    try {
      await dodaj(produkt.id, 1);
      setToast(`${produkt.nazwa.substring(0, 30)} — dodano do koszyka!`);
    } catch (err) {
      setToast('Błąd: ' + err.message);
    }
  }

  const d = details || produkt;
  const outOfStock = d.stan_magazynowy === 0;

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.header}>
          <div>
            <div style={S.producer}>{d.producent}</div>
            <div style={S.title}>{d.nazwa}</div>
            <div style={S.sku}>SKU: {d.sku}</div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.body}>
          <div style={S.price}>{Number(d.cena_brutto).toFixed(2)} zł</div>

          {d.opis && <div style={S.desc}>{d.opis}</div>}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div className="spinner" />
            </div>
          ) : (
            <>
              {details?.cechy?.length > 0 && (
                <div style={S.section}>
                  <div style={S.sectionTitle}>Dane techniczne</div>
                  <div style={S.attrsGrid}>
                    {details.cechy.map((c, i) => (
                      <div key={i} style={S.attr}>
                        <span style={S.attrKey}>{c.atrybut}</span>
                        <span style={S.attrVal}>{c.wartosc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {details?.dopasowania?.length > 0 && (
                <div style={S.section}>
                  <div style={S.sectionTitle}>Pasuje do pojazdów ({details.dopasowania.length})</div>
                  <div style={S.vehicleList}>
                    {details.dopasowania.slice(0, 12).map((v, i) => (
                      <span key={i} style={S.vehicleTag}>
                        {v.marka} {v.model} {v.pojemnosc} {v.moc_km}KM
                      </span>
                    ))}
                    {details.dopasowania.length > 12 && (
                      <span style={{ ...S.vehicleTag, color: 'var(--text3)' }}>
                        +{details.dopasowania.length - 12} więcej
                      </span>
                    )}
                  </div>
                </div>
              )}

              {details?.opinie?.length > 0 && (
                <div style={S.section}>
                  <div style={S.sectionTitle}>Opinie ({details.opinie.length})</div>
                  {details.opinie.slice(0, 3).map((o, i) => (
                    <div key={i} style={{ marginBottom: '.65rem', padding: '.7rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.3rem' }}>
                        <span style={{ color: '#facc15', fontSize: '.85rem' }}>{'★'.repeat(o.ocena)}</span>
                        <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{o.autor}</span>
                      </div>
                      <div style={{ fontSize: '.83rem', color: 'var(--text2)' }}>{o.komentarz}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div style={S.footer}>
          <div style={{ fontSize: '.82rem', color: outOfStock ? 'var(--red)' : 'var(--success)', fontWeight: 600 }}>
            {outOfStock ? '✕ Niedostępny' : `✓ Dostępny (${d.stan_magazynowy} szt.)`}
          </div>
          <button style={S.addBtn(outOfStock)} onClick={handleAdd} disabled={outOfStock}>
            {outOfStock ? 'Brak w magazynie' : 'Dodaj do koszyka'}
          </button>
        </div>
      </div>
    </div>
  );
}
