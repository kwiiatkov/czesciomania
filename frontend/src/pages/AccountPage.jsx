import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { kontoApi, zamowieniaApi } from '../api/index.js';

const S = {
  page: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.5rem' },
  tabs: { display: 'flex', gap: '.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '.5rem' },
  tab: (active) => ({
    background: active ? 'rgba(0,212,255,0.1)' : 'none',
    color: active ? 'var(--accent)' : 'var(--text2)',
    border: active ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
    borderRadius: '8px', padding: '.45rem .9rem', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
  }),
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '.75rem' },
  sectionTitle: { fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem' },
  vehicleTag: { background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '8px', padding: '.6rem 1rem', marginBottom: '.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: (s) => {
    const map = { nowe: ['var(--text3)', 'rgba(255,255,255,0.06)'], oplacone: ['#facc15', 'rgba(234,179,8,0.1)'], wyslane: ['var(--accent)', 'rgba(0,212,255,0.1)'], zakonczone: ['var(--success)', 'rgba(34,197,94,0.1)'] };
    const [c, bg] = map[s] || [map.nowe[0], map.nowe[1]];
    return { color: c, background: bg, borderRadius: '6px', padding: '.2rem .6rem', fontSize: '.75rem', fontWeight: 700 };
  },
  deleteBtn: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', borderRadius: '6px', padding: '.3rem .6rem', fontSize: '.8rem', cursor: 'pointer' },
  select: { marginBottom: '.6rem' },
  addBtn: { background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: 'var(--accent)', borderRadius: '8px', padding: '.5rem 1rem', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', marginTop: '.5rem' },
};

export default function AccountPage({ navigate }) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('profile');
  const [garaz, setGaraz] = useState([]);
  const [zamowienia, setZamowienia] = useState([]);
  const [marki, setMarki] = useState([]);
  const [modele, setModele] = useState([]);
  const [typy, setTypy] = useState([]);
  const [selectedMarka, setSelectedMarka] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedTyp, setSelectedTyp] = useState('');
  const [nazwaWlasna, setNazwaWlasna] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    kontoApi.garaz().then(setGaraz).catch(() => {});
    kontoApi.marki().then(setMarki).catch(() => {});
    zamowieniaApi.lista().then(setZamowienia).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (selectedMarka) kontoApi.modele(selectedMarka).then(setModele).catch(() => {});
    else setModele([]);
    setSelectedModel('');
    setSelectedTyp('');
  }, [selectedMarka]);

  useEffect(() => {
    if (selectedModel) kontoApi.typy(selectedModel).then(setTypy).catch(() => {});
    else setTypy([]);
    setSelectedTyp('');
  }, [selectedModel]);

  async function addCar() {
    if (!selectedTyp) return;
    setLoading(true);
    try {
      await kontoApi.dodajAuto({ typ_silnikowy_id: parseInt(selectedTyp), nazwa_wlasna: nazwaWlasna || undefined });
      const fresh = await kontoApi.garaz();
      setGaraz(fresh);
      setSelectedMarka(''); setSelectedModel(''); setSelectedTyp(''); setNazwaWlasna('');
    } finally {
      setLoading(false);
    }
  }

  async function deleteCar(id) {
    await kontoApi.usunAuto(id);
    setGaraz(g => g.filter(c => c.id !== id));
  }

  if (!user) {
    return (
      <div style={S.page}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <button onClick={() => navigate('login')} style={{ background: 'var(--accent)', color: '#070b13', border: 'none', borderRadius: '10px', padding: '.7rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Zaloguj się
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.title}>Moje konto</div>

      <div style={S.tabs}>
        {[['profile', 'Profil'], ['garaz', 'Mój Garaż'], ['orders', 'Zamówienia']].map(([id, label]) => (
          <button key={id} style={S.tab(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
        <button style={{ ...S.tab(false), marginLeft: 'auto', color: 'var(--red)' }} onClick={logout}>Wyloguj</button>
      </div>

      {tab === 'profile' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Dane konta</div>
          <div style={{ marginBottom: '.6rem' }}>
            <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: '.2rem' }}>E-mail</div>
            <div style={{ fontWeight: 600 }}>{user.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: '.2rem' }}>Rola</div>
            <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{user.rola}</div>
          </div>
        </div>
      )}

      {tab === 'garaz' && (
        <div>
          <div style={S.sectionTitle}>Twoje pojazdy ({garaz.length})</div>
          {garaz.length === 0 && <div style={{ color: 'var(--text3)', marginBottom: '1rem', fontSize: '.88rem' }}>Brak pojazdów w garażu.</div>}
          {garaz.map(car => (
            <div key={car.id} style={S.vehicleTag}>
              <div>
                <div style={{ fontWeight: 700 }}>{car.nazwa_wlasna || `${car.marka} ${car.model}`}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
                  {car.marka} {car.model} · {car.pojemnosc} · {car.moc_km} KM · {car.paliwo}
                </div>
              </div>
              <button style={S.deleteBtn} onClick={() => deleteCar(car.id)}>Usuń</button>
            </div>
          ))}

          <div style={{ ...S.card, marginTop: '1.5rem' }}>
            <div style={S.sectionTitle}>Dodaj pojazd</div>
            <select style={S.select} value={selectedMarka} onChange={e => setSelectedMarka(e.target.value)}>
              <option value="">Wybierz markę...</option>
              {marki.map(m => <option key={m.id} value={m.id}>{m.nazwa}</option>)}
            </select>
            {selectedMarka && (
              <select style={S.select} value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
                <option value="">Wybierz model...</option>
                {modele.map(m => <option key={m.id} value={m.id}>{m.nazwa} ({m.lata_produkcji})</option>)}
              </select>
            )}
            {selectedModel && typy.length > 0 && (
              <select style={S.select} value={selectedTyp} onChange={e => setSelectedTyp(e.target.value)}>
                <option value="">Wybierz silnik...</option>
                {typy.map(t => <option key={t.id} value={t.id}>{t.pojemnosc} · {t.moc_km} KM · {t.paliwo}</option>)}
              </select>
            )}
            {selectedTyp && (
              <input placeholder="Własna nazwa pojazdu (opcjonalnie)" value={nazwaWlasna} onChange={e => setNazwaWlasna(e.target.value)} style={{ marginBottom: '.6rem' }} />
            )}
            <button style={S.addBtn} onClick={addCar} disabled={!selectedTyp || loading}>
              {loading ? 'Dodawanie...' : '+ Dodaj do garażu'}
            </button>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div>
          <div style={S.sectionTitle}>Historia zamówień ({zamowienia.length})</div>
          {zamowienia.length === 0 && <div style={{ color: 'var(--text3)', fontSize: '.88rem' }}>Brak zamówień.</div>}
          {zamowienia.map(z => (
            <div key={z.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Zamówienie #{z.id}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{new Date(z.data_zamowienia).toLocaleDateString('pl-PL')}</div>
                </div>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <span style={S.statusBadge(z.aktualny_status)}>{z.aktualny_status}</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{Number(z.suma_brutto).toFixed(2)} zł</span>
                </div>
              </div>
              {z.pozycje?.map((p, i) => (
                <div key={i} style={{ fontSize: '.8rem', color: 'var(--text2)', paddingLeft: '.5rem', marginBottom: '.2rem' }}>
                  · {p.producent} — {p.nazwa} × {p.ilosc}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
