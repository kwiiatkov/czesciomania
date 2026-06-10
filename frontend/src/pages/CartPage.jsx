import { useCart } from '../hooks/useCart.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { zamowieniaApi, kontoApi } from '../api/index.js';
import { useState, useEffect } from 'react';

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

// ─── Ekran adresu dostawy ────────────────────────────────
function AddressScreen({ onNext, onBack }) {
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('loading'); // loading | choose | new
  const [saving, setSaving] = useState(false);
  const [saveToAccount, setSaveToAccount] = useState(false);
  const [form, setForm] = useState({
    typ_adresu: 'wysylka',
    ulica: '',
    miasto: '',
    kod_pocztowy: '',
    kraj: 'Polska',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    kontoApi.adresy()
      .then(list => {
        setSavedAddresses(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
          setMode('choose');
        } else {
          setMode('new');
        }
      })
      .catch(() => setMode('new'));
  }, []);

  function validateForm() {
    if (!form.ulica.trim()) { setError('Wpisz ulicę i numer'); return false; }
    if (!form.miasto.trim()) { setError('Wpisz miasto'); return false; }
    if (!form.kod_pocztowy.trim()) { setError('Wpisz kod pocztowy'); return false; }
    return true;
  }

  async function handleNext() {
    setError('');
    if (mode === 'choose' && selectedId) {
      const addr = savedAddresses.find(a => a.id === selectedId);
      onNext({ adres: addr, adres_id: selectedId });
      return;
    }
    // nowy adres
    if (!validateForm()) return;
    setSaving(true);
    try {
      let adres_id = null;
      if (saveToAccount) {
        const res = await kontoApi.dodajAdres(form);
        // pobierz świeże adresy żeby mieć id
        const fresh = await kontoApi.adresy();
        const newest = fresh[fresh.length - 1];
        adres_id = newest?.id || null;
      }
      onNext({ adres: form, adres_id });
    } catch (e) {
      setError('Błąd zapisu adresu: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (mode === 'loading') return (
    <div style={{ maxWidth: 520, margin: '4rem auto', textAlign: 'center', color: 'var(--text3)' }}>Ładowanie adresów…</div>
  );

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '.88rem', marginBottom: '1.25rem', padding: 0 }}>
        ← Wróć do koszyka
      </button>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem' }}>📦 Adres dostawy</h2>

      {savedAddresses.length > 0 && (
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setMode('choose')}
            style={{
              flex: 1, padding: '.55rem', borderRadius: 8, fontWeight: 600, fontSize: '.85rem', cursor: 'pointer', fontFamily: 'inherit',
              background: mode === 'choose' ? 'rgba(0,212,255,0.1)' : 'var(--bg2)',
              border: `1px solid ${mode === 'choose' ? 'rgba(0,212,255,0.4)' : 'var(--border)'}`,
              color: mode === 'choose' ? 'var(--accent)' : 'var(--text2)',
            }}
          >
            Zapisane adresy
          </button>
          <button
            onClick={() => setMode('new')}
            style={{
              flex: 1, padding: '.55rem', borderRadius: 8, fontWeight: 600, fontSize: '.85rem', cursor: 'pointer', fontFamily: 'inherit',
              background: mode === 'new' ? 'rgba(0,212,255,0.1)' : 'var(--bg2)',
              border: `1px solid ${mode === 'new' ? 'rgba(0,212,255,0.4)' : 'var(--border)'}`,
              color: mode === 'new' ? 'var(--accent)' : 'var(--text2)',
            }}
          >
            Nowy adres
          </button>
        </div>
      )}

      {mode === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '1.25rem' }}>
          {savedAddresses.map(addr => (
            <div
              key={addr.id}
              onClick={() => setSelectedId(addr.id)}
              style={{
                background: selectedId === addr.id ? 'rgba(0,212,255,0.08)' : 'var(--bg2)',
                border: `1px solid ${selectedId === addr.id ? 'rgba(0,212,255,0.4)' : 'var(--border)'}`,
                borderRadius: 10, padding: '1rem 1.25rem', cursor: 'pointer', transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: '1rem',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{addr.ulica}</div>
                <div style={{ fontSize: '.8rem', color: 'var(--text3)', marginTop: 2 }}>{addr.kod_pocztowy} {addr.miasto}, {addr.kraj}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 2, textTransform: 'capitalize' }}>{addr.typ_adresu}</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: `2px solid ${selectedId === addr.id ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedId === addr.id ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {selectedId === addr.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#070b13' }} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'new' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '.82rem', color: 'var(--text3)', marginBottom: '.4rem', fontWeight: 600 }}>ULICA I NUMER *</label>
              <input value={form.ulica} onChange={e => setForm(f => ({ ...f, ulica: e.target.value }))} placeholder="ul. Przykładowa 12/3" style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.82rem', color: 'var(--text3)', marginBottom: '.4rem', fontWeight: 600 }}>KOD POCZTOWY *</label>
                <input
                  value={form.kod_pocztowy}
                  onChange={e => {
                    let v = e.target.value.replace(/[^\d]/g, '').slice(0, 5);
                    if (v.length > 2) v = v.slice(0, 2) + '-' + v.slice(2);
                    setForm(f => ({ ...f, kod_pocztowy: v }));
                  }}
                  placeholder="00-000"
                  style={{ width: '100%', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.82rem', color: 'var(--text3)', marginBottom: '.4rem', fontWeight: 600 }}>MIASTO *</label>
                <input value={form.miasto} onChange={e => setForm(f => ({ ...f, miasto: e.target.value }))} placeholder="Warszawa" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.82rem', color: 'var(--text3)', marginBottom: '.4rem', fontWeight: 600 }}>KRAJ</label>
              <input value={form.kraj} onChange={e => setForm(f => ({ ...f, kraj: e.target.value }))} placeholder="Polska" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.82rem', color: 'var(--text3)', marginBottom: '.4rem', fontWeight: 600 }}>TYP ADRESU</label>
              <select value={form.typ_adresu} onChange={e => setForm(f => ({ ...f, typ_adresu: e.target.value }))} style={{ width: '100%' }}>
                <option value="wysylka">Wysyłkowy</option>
                <option value="domowy">Domowy</option>
                <option value="faktura">Fakturowy</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer', fontSize: '.88rem', color: 'var(--text2)', marginTop: '.25rem' }}>
              <input
                type="checkbox"
                checked={saveToAccount}
                onChange={e => setSaveToAccount(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              Zapisz adres w moim koncie
            </label>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 8, padding: '.7rem 1rem', fontSize: '.85rem', marginBottom: '1rem' }}>
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={saving || (mode === 'choose' && !selectedId)}
        style={{
          width: '100%', padding: '.9rem', background: 'var(--accent)',
          color: '#070b13', border: 'none', borderRadius: 10,
          fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {saving ? 'Zapisywanie…' : 'Dalej → Płatność'}
      </button>
    </div>
  );
}

// ─── Ekran symulacji płatności ────────────────────────
const PAYMENT_METHODS = [
  { id: 'blik',    label: 'BLIK',           icon: '📱', desc: 'Kod BLIK z aplikacji bankowej' },
  { id: 'card',    label: 'Karta płatnicza', icon: '💳', desc: 'Visa, Mastercard, Maestro' },
  { id: 'transfer',label: 'Przelew online',  icon: '🏦', desc: 'Szybki przelew przez bank' },
  { id: 'cod',     label: 'Za pobraniem',    icon: '📦', desc: 'Płatność przy odbiorze (+5 zł)' },
];

function PaymentScreen({ razem, adresInfo, onSuccess, onBack }) {
  const [method, setMethod]   = useState('blik');
  const [step, setStep]       = useState('choose');
  const [blik, setBlik]       = useState('');
  const [card, setCard]       = useState({ nr: '', exp: '', cvv: '', name: '' });
  const [progress, setProgress] = useState(0);
  const [error, setError]     = useState('');

  const total = method === 'cod' ? razem + 5 : razem;

  function formatBlik(v) { const d = v.replace(/\D/g,'').slice(0,6); return d.length > 3 ? d.slice(0,3)+' '+d.slice(3) : d; }
  function formatCard(v) { return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim(); }
  function formatExp(v)  { const d = v.replace(/\D/g,'').slice(0,4); return d.length > 2 ? d.slice(0,2)+'/'+d.slice(2) : d; }

  function validate() {
    if (method === 'blik' && blik.replace(/\s/g,'').length !== 6) { setError('Wpisz 6-cyfrowy kod BLIK'); return false; }
    if (method === 'card') {
      if (card.nr.replace(/\s/g,'').length !== 16) { setError('Nieprawidłowy numer karty'); return false; }
      if (card.exp.length < 5) { setError('Wpisz datę ważności'); return false; }
      if (card.cvv.length < 3) { setError('Wpisz CVV'); return false; }
      if (!card.name.trim()) { setError('Wpisz imię i nazwisko'); return false; }
    }
    return true;
  }

  async function handlePay() {
    setError('');
    if (!validate()) return;
    setStep('processing');
    const steps = [{ pct:20,ms:400 },{ pct:55,ms:900 },{ pct:80,ms:600 },{ pct:100,ms:500 }];
    let total_ms = 0;
    for (const s of steps) { total_ms += s.ms; setTimeout(() => setProgress(s.pct), total_ms - s.ms); }
    setTimeout(() => { setStep('done'); setTimeout(() => onSuccess(), 1800); }, total_ms + 300);
  }

  const adresLabel = adresInfo
    ? `${adresInfo.ulica}, ${adresInfo.kod_pocztowy} ${adresInfo.miasto}`
    : '';

  if (step === 'choose') return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:'.88rem', marginBottom:'1.25rem', padding:0 }}>
        ← Zmień adres dostawy
      </button>
      <h2 style={{ fontSize:'1.4rem', fontWeight:800, marginBottom:'1rem' }}>Wybierz metodę płatności</h2>

      {adresLabel && (
        <div style={{ background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:10, padding:'.75rem 1rem', marginBottom:'1.25rem', fontSize:'.85rem' }}>
          📦 <span style={{ color:'var(--text3)' }}>Dostawa na:</span> <strong>{adresLabel}</strong>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:'.75rem', marginBottom:'1.5rem' }}>
        {PAYMENT_METHODS.map(m => (
          <div key={m.id} onClick={() => setMethod(m.id)} style={{
            display:'flex', alignItems:'center', gap:'1rem',
            background: method === m.id ? 'rgba(0,212,255,0.08)' : 'var(--bg2)',
            border: `1px solid ${method === m.id ? 'rgba(0,212,255,0.4)' : 'var(--border)'}`,
            borderRadius:12, padding:'1rem 1.25rem', cursor:'pointer', transition:'all .15s',
          }}>
            <span style={{ fontSize:'1.6rem' }}>{m.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:'.95rem' }}>{m.label}</div>
              <div style={{ fontSize:'.78rem', color:'var(--text3)', marginTop:2 }}>{m.desc}</div>
            </div>
            <div style={{ width:20,height:20,borderRadius:'50%',border:`2px solid ${method===m.id?'var(--accent)':'var(--border)'}`,background:method===m.id?'var(--accent)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              {method===m.id&&<div style={{ width:8,height:8,borderRadius:'50%',background:'#070b13' }}/>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:'1rem 1.25rem',display:'flex',justifyContent:'space-between',marginBottom:'1rem' }}>
        <span style={{ color:'var(--text3)' }}>Do zapłaty</span>
        <span style={{ fontWeight:800,color:'var(--accent)',fontSize:'1.1rem' }}>{total.toFixed(2)} zł</span>
      </div>

      <button onClick={() => setStep('form')} style={{ width:'100%',padding:'.9rem',background:'var(--accent)',color:'#070b13',border:'none',borderRadius:10,fontSize:'1rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>
        Dalej →
      </button>
    </div>
  );

  if (step === 'form') return (
    <div style={{ maxWidth:520, margin:'0 auto' }}>
      <button onClick={() => setStep('choose')} style={{ background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:'.88rem',marginBottom:'1.25rem',padding:0 }}>
        ← Zmień metodę
      </button>
      <h2 style={{ fontSize:'1.4rem',fontWeight:800,marginBottom:'1.5rem' }}>
        {PAYMENT_METHODS.find(m=>m.id===method)?.icon} {PAYMENT_METHODS.find(m=>m.id===method)?.label}
      </h2>

      <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'1.5rem',marginBottom:'1.25rem' }}>
        {method==='blik'&&(
          <div>
            <label style={{ display:'block',fontSize:'.82rem',color:'var(--text3)',marginBottom:'.5rem',fontWeight:600 }}>KOD BLIK</label>
            <input value={blik} onChange={e=>setBlik(formatBlik(e.target.value))} placeholder="000 000"
              style={{ width:'100%',textAlign:'center',fontSize:'2rem',fontWeight:800,letterSpacing:'.15em',padding:'.75rem',borderRadius:10,background:'var(--bg)',border:'1px solid var(--border)',color:'var(--text)',fontFamily:'monospace' }} />
            <div style={{ fontSize:'.78rem',color:'var(--text3)',marginTop:'.6rem',textAlign:'center' }}>Otwórz aplikację bankową i wygeneruj kod BLIK</div>
          </div>
        )}
        {method==='card'&&(
          <div style={{ display:'flex',flexDirection:'column',gap:'.9rem' }}>
            <div>
              <label style={{ display:'block',fontSize:'.82rem',color:'var(--text3)',marginBottom:'.4rem',fontWeight:600 }}>NUMER KARTY</label>
              <input value={card.nr} onChange={e=>setCard(c=>({...c,nr:formatCard(e.target.value)}))} placeholder="0000 0000 0000 0000" style={{ width:'100%',letterSpacing:'.1em',fontFamily:'monospace' }} />
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem' }}>
              <div>
                <label style={{ display:'block',fontSize:'.82rem',color:'var(--text3)',marginBottom:'.4rem',fontWeight:600 }}>DATA WAŻNOŚCI</label>
                <input value={card.exp} onChange={e=>setCard(c=>({...c,exp:formatExp(e.target.value)}))} placeholder="MM/RR" style={{ width:'100%',fontFamily:'monospace' }} />
              </div>
              <div>
                <label style={{ display:'block',fontSize:'.82rem',color:'var(--text3)',marginBottom:'.4rem',fontWeight:600 }}>CVV</label>
                <input value={card.cvv} onChange={e=>setCard(c=>({...c,cvv:e.target.value.replace(/\D/g,'').slice(0,3)}))} placeholder="•••" type="password" style={{ width:'100%',fontFamily:'monospace' }} />
              </div>
            </div>
            <div>
              <label style={{ display:'block',fontSize:'.82rem',color:'var(--text3)',marginBottom:'.4rem',fontWeight:600 }}>IMIĘ I NAZWISKO</label>
              <input value={card.name} onChange={e=>setCard(c=>({...c,name:e.target.value}))} placeholder="Jan Kowalski" style={{ width:'100%',textTransform:'uppercase' }} />
            </div>
          </div>
        )}
        {method==='transfer'&&(
          <div style={{ textAlign:'center',padding:'1rem 0' }}>
            <div style={{ fontSize:'2.5rem',marginBottom:'.75rem' }}>🏦</div>
            <div style={{ fontWeight:700,marginBottom:'.5rem' }}>Przekierowanie do banku</div>
            <div style={{ fontSize:'.85rem',color:'var(--text3)' }}>Po kliknięciu „Zapłać" zostaniesz przekierowany do swojego banku.</div>
          </div>
        )}
        {method==='cod'&&(
          <div style={{ textAlign:'center',padding:'1rem 0' }}>
            <div style={{ fontSize:'2.5rem',marginBottom:'.75rem' }}>📦</div>
            <div style={{ fontWeight:700,marginBottom:'.5rem' }}>Płatność przy odbiorze</div>
            <div style={{ fontSize:'.85rem',color:'var(--text3)' }}>Zapłacisz gotówką lub kartą kurierowi. Dopłata: <strong>5,00 zł</strong></div>
          </div>
        )}
      </div>

      {error&&<div style={{ background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#f87171',borderRadius:8,padding:'.7rem 1rem',fontSize:'.85rem',marginBottom:'1rem' }}>⚠️ {error}</div>}

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:'1rem 1.25rem',marginBottom:'1rem' }}>
        <span style={{ color:'var(--text3)' }}>Do zapłaty</span>
        <span style={{ fontWeight:800,color:'var(--accent)',fontSize:'1.1rem' }}>{total.toFixed(2)} zł</span>
      </div>

      <button onClick={handlePay} style={{ width:'100%',padding:'.9rem',background:'var(--accent)',color:'#070b13',border:'none',borderRadius:10,fontSize:'1rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>
        🔒 Zapłać {total.toFixed(2)} zł
      </button>
      <div style={{ textAlign:'center',fontSize:'.75rem',color:'var(--text3)',marginTop:'.6rem' }}>Bezpieczna symulacja płatności • dane nie są przesyłane</div>
    </div>
  );

  if (step==='processing') return (
    <div style={{ maxWidth:420,margin:'4rem auto',textAlign:'center' }}>
      <div style={{ fontSize:'3rem',marginBottom:'1.5rem' }}>{method==='blik'?'📱':method==='card'?'💳':method==='transfer'?'🏦':'📦'}</div>
      <h2 style={{ fontWeight:800,fontSize:'1.3rem',marginBottom:'.5rem' }}>Przetwarzanie płatności…</h2>
      <div style={{ color:'var(--text3)',fontSize:'.88rem',marginBottom:'2rem' }}>
        {method==='blik'&&'Weryfikacja kodu BLIK…'}
        {method==='card'&&'Autoryzacja karty płatniczej…'}
        {method==='transfer'&&'Potwierdzanie przelewu…'}
        {method==='cod'&&'Potwierdzanie zamówienia…'}
      </div>
      <div style={{ background:'var(--bg2)',borderRadius:100,height:8,overflow:'hidden',margin:'0 auto',maxWidth:320 }}>
        <div style={{ height:'100%',borderRadius:100,background:'linear-gradient(90deg, var(--accent), #a855f7)',width:`${progress}%`,transition:'width .4s ease' }} />
      </div>
      <div style={{ color:'var(--text3)',fontSize:'.8rem',marginTop:'.75rem' }}>{progress}%</div>
    </div>
  );

  if (step==='done') return (
    <div style={{ maxWidth:420,margin:'4rem auto',textAlign:'center' }}>
      <div style={{ fontSize:'4rem',marginBottom:'1rem' }}>✅</div>
      <h2 style={{ fontWeight:800,fontSize:'1.4rem',color:'#4ade80',marginBottom:'.5rem' }}>Płatność zaakceptowana!</h2>
      <div style={{ color:'var(--text3)',fontSize:'.9rem' }}>Składamy Twoje zamówienie…</div>
    </div>
  );
}

// ─── Checkout flow: koszyk → adres → płatność ────────
// step: 'cart' | 'address' | 'payment'

export default function CartPage({ navigate, setToast }) {
  const { items, zmienIlosc, usun, suma, count } = useCart();
  const { user } = useAuth();
  const [loading, setLoading]           = useState(false);
  const [kodRabatowy, setKodRabatowy]   = useState('');
  const [applied, setApplied]           = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [step, setStep]                 = useState('cart'); // cart | address | payment
  const [adresData, setAdresData]       = useState(null);  // { adres, adres_id }

  if (!user) return (
    <div style={S.page}>
      <div style={S.empty}>
        <div style={S.emptyIcon}>🔒</div>
        <div style={{ fontWeight:600,marginBottom:'.5rem' }}>Zaloguj się, aby zobaczyć koszyk</div>
        <button onClick={() => navigate('login')} style={{ marginTop:'1rem',background:'var(--accent)',color:'#070b13',border:'none',borderRadius:'10px',padding:'.7rem 1.5rem',fontWeight:700,fontSize:'.9rem',cursor:'pointer',fontFamily:'inherit' }}>
          Zaloguj się
        </button>
      </div>
    </div>
  );

  if (orderSuccess) return (
    <div style={S.page}>
      <div style={{ textAlign:'center',padding:'4rem' }}>
        <div style={{ fontSize:'4rem',marginBottom:'1rem' }}>🎉</div>
        <div style={{ fontWeight:800,fontSize:'1.5rem',marginBottom:'.5rem' }}>Zamówienie złożone!</div>
        <div style={{ color:'var(--text3)',marginBottom:'.5rem' }}>Nr zamówienia: <strong style={{ color:'var(--accent)' }}>#{orderSuccess}</strong></div>
        {adresData?.adres && (
          <div style={{ color:'var(--text3)',fontSize:'.85rem',marginBottom:'.25rem' }}>
            📦 Dostawa: {adresData.adres.ulica}, {adresData.adres.kod_pocztowy} {adresData.adres.miasto}
          </div>
        )}
        <div style={{ color:'var(--text3)',fontSize:'.88rem',marginBottom:'2rem' }}>Potwierdzenie zostanie wysłane na Twój adres email.</div>
        <div style={{ display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap' }}>
          <button onClick={() => navigate('orders')} style={{ background:'var(--accent)',color:'#070b13',border:'none',borderRadius:'10px',padding:'.7rem 1.5rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>
            Moje zamówienia
          </button>
          <button onClick={() => navigate('shop')} style={{ background:'rgba(255,255,255,0.07)',color:'var(--text)',border:'1px solid var(--border)',borderRadius:'10px',padding:'.7rem 1.5rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>
            Wróć do sklepu
          </button>
        </div>
      </div>
    </div>
  );

  if (count === 0 && step === 'cart') return (
    <div style={S.page}>
      <div style={S.empty}>
        <div style={S.emptyIcon}>🛒</div>
        <div style={{ fontWeight:600,marginBottom:'.5rem' }}>Koszyk jest pusty</div>
        <button onClick={() => navigate('shop')} style={{ marginTop:'1rem',background:'var(--accent)',color:'#070b13',border:'none',borderRadius:'10px',padding:'.7rem 1.5rem',fontWeight:700,fontSize:'.9rem',cursor:'pointer',fontFamily:'inherit' }}>
          Wróć do sklepu
        </button>
      </div>
    </div>
  );

  async function handlePaymentSuccess() {
    setLoading(true);
    try {
      const payload = { kod_rabatowy: applied ? kodRabatowy : undefined };
      if (adresData?.adres_id) payload.adres_id = adresData.adres_id;
      const res = await zamowieniaApi.zloz(payload);
      setOrderSuccess(res.zamowienie_id);
      setStep('cart');
    } catch (err) {
      setToast('Błąd: ' + err.message);
      setStep('address');
    } finally {
      setLoading(false);
    }
  }

  const dostawaGratis = suma >= 300;
  const dostawa = dostawaGratis ? 0 : DELIVERY;
  const razem = suma + dostawa;

  // ── Krok: Adres
  if (step === 'address') return (
    <div style={S.page}>
      <AddressScreen
        onNext={(data) => { setAdresData(data); setStep('payment'); }}
        onBack={() => setStep('cart')}
      />
    </div>
  );

  // ── Krok: Płatność
  if (step === 'payment') return (
    <div style={S.page}>
      <PaymentScreen
        razem={razem}
        adresInfo={adresData?.adres}
        onSuccess={handlePaymentSuccess}
        onBack={() => setStep('address')}
      />
    </div>
  );

  // ── Krok: Koszyk
  return (
    <div style={S.page}>
      {/* Pasek kroków */}
      <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'1.75rem', fontSize:'.82rem', fontWeight:600 }}>
        {[['cart','🛒 Koszyk'],['address','📦 Adres'],['payment','💳 Płatność']].map(([id,label],i,arr) => (
          <div key={id} style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <span style={{ color: step===id ? 'var(--accent)' : 'var(--text3)', fontWeight: step===id?700:400 }}>{label}</span>
            {i < arr.length-1 && <span style={{ color:'var(--border)' }}>›</span>}
          </div>
        ))}
      </div>

      <div style={S.title}>Koszyk ({count} szt.)</div>

      {items.map(item => (
        <div key={item.id} style={S.item}>
          <div style={{ flex:1 }}>
            <div style={S.itemBrand}>{item.producent}</div>
            <div style={S.itemName}>{item.nazwa}</div>
            <div style={{ fontSize:'.75rem',color:'var(--text3)' }}>{item.sku}</div>
          </div>
          <div style={S.qtyWrap}>
            <button style={S.qtyBtn} onClick={() => item.ilosc>1?zmienIlosc(item.id,item.ilosc-1):usun(item.id)}>−</button>
            <span style={S.qtyNum}>{item.ilosc}</span>
            <button style={S.qtyBtn} onClick={() => zmienIlosc(item.id,item.ilosc+1)} disabled={item.ilosc>=item.stan_magazynowy}>+</button>
          </div>
          <div style={S.price}>{(item.cena_brutto*item.ilosc).toFixed(2)} zł</div>
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
          <span style={dostawaGratis?{color:'var(--success)'}:{}}>{dostawaGratis?'GRATIS':`${dostawa.toFixed(2)} zł`}</span>
        </div>
        {!dostawaGratis && <div style={{ fontSize:'.78rem',color:'var(--text3)',marginBottom:'.5rem' }}>Brakuje {(300-suma).toFixed(2)} zł do darmowej dostawy</div>}

        <div style={S.total}><span>Do zapłaty</span><span style={{ color:'var(--accent)' }}>{razem.toFixed(2)} zł</span></div>

        <button
          onClick={() => setStep('address')}
          disabled={loading}
          style={{ width:'100%',marginTop:'1rem',padding:'.9rem',background:'var(--accent)',color:'#070b13',border:'none',borderRadius:'10px',fontSize:'1rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'.5rem' }}
        >
          Podaj adres dostawy →
        </button>
      </div>
    </div>
  );
}