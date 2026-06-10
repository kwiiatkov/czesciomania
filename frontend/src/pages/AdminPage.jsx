import { useState, useEffect, useCallback } from 'react';

const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

function token() { return localStorage.getItem('czesciomania_token'); }

async function api(path, opts = {}) {
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };
  const r = await fetch(`${BASE}${path}`, { ...opts, headers: h });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Błąd ${r.status}`);
  return d;
}

// ─── Kolory / styl ────────────────────────────────────
const C = {
  bg:     '#0d0f14',
  bg2:    '#13161e',
  bg3:    '#1a1e2a',
  border: 'rgba(255,255,255,0.07)',
  accent: '#f97316',    // pomarańczowy — pasuje do motoryzacji
  accent2:'#fb923c',
  text:   '#e8eaf0',
  muted:  '#7c8395',
  green:  '#22c55e',
  red:    '#ef4444',
  blue:   '#3b82f6',
  yellow: '#eab308',
};

const STATUS_COLORS = {
  nowe:        '#3b82f6',
  oplacone:    '#a855f7',
  wyslane:     '#f97316',
  zakonczone:  '#22c55e',
  anulowane:   '#ef4444',
  zlozona:     '#3b82f6',
  rozpatrywana:'#f97316',
  zakonczona:  '#22c55e',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.text}; font-family: 'Inter', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${C.bg2}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
  input, select, textarea {
    background: ${C.bg}; color: ${C.text}; border: 1px solid ${C.border};
    border-radius: 8px; padding: .55rem .85rem; font-size: .88rem; font-family: inherit;
    outline: none; transition: border-color .2s;
  }
  input:focus, select:focus, textarea:focus { border-color: ${C.accent}; }
  button { cursor: pointer; font-family: inherit; border: none; border-radius: 8px; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
`;

// ─── Komponenty pomocnicze ────────────────────────────
function Badge({ label, color }) {
  return (
    <span style={{
      background: `${color}22`, color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: '2px 10px', fontSize: '.78rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '.04em',
    }}>{label}</span>
  );
}

function Btn({ children, onClick, variant = 'primary', small, disabled, style: s }) {
  const styles = {
    primary:  { background: C.accent,  color: '#fff' },
    ghost:    { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` },
    danger:   { background: `${C.red}22`, color: C.red, border: `1px solid ${C.red}44` },
    success:  { background: `${C.green}22`, color: C.green, border: `1px solid ${C.green}44` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? '.3rem .75rem' : '.55rem 1.1rem',
        fontSize: small ? '.8rem' : '.88rem',
        fontWeight: 600,
        opacity: disabled ? .5 : 1,
        transition: 'opacity .15s, filter .15s',
        ...styles[variant],
        ...s,
      }}
    >{children}</button>
  );
}

function Card({ children, style: s }) {
  return (
    <div style={{
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '1.25rem',
      animation: 'fadeIn .3s ease both',
      ...s,
    }}>{children}</div>
  );
}

function Table({ cols, rows, renderRow, empty = 'Brak danych' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.875rem' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {cols.map(c => (
              <th key={c} style={{ padding: '.65rem 1rem', color: C.muted, textAlign: 'left', fontWeight: 600, fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={cols.length} style={{ padding: '2rem', textAlign: 'center', color: C.muted }}>{empty}</td></tr>
            : rows.map((r, i) => renderRow(r, i))
          }
        </tbody>
      </table>
    </div>
  );
}

function TR({ children, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderBottom: `1px solid ${C.border}`,
        background: hover ? `${C.border}` : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background .1s',
      }}
    >{children}</tr>
  );
}

function TD({ children }) {
  return <td style={{ padding: '.7rem 1rem', color: C.text }}>{children}</td>;
}

function Pagination({ page, total, limit, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: '1rem' }}>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(p)} style={{
          width: 32, height: 32, borderRadius: 6, border: `1px solid ${p === page ? C.accent : C.border}`,
          background: p === page ? C.accent : 'transparent',
          color: p === page ? '#fff' : C.muted, fontWeight: 600, fontSize: '.82rem',
        }}>{p}</button>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.bg2, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: '1.75rem', width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn .2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', color: C.muted, fontSize: '1.2rem', border: 'none', cursor: 'pointer', padding: '.2rem .5rem' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '.85rem' }}>
      <label style={{ display: 'block', fontSize: '.8rem', color: C.muted, marginBottom: '.3rem', fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Sekcje ───────────────────────────────────────────

function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api('/admin/stats').then(setData).catch(() => {}); }, []);
  if (!data) return <div style={{ color: C.muted, padding: '2rem' }}>Ładowanie…</div>;

  const stats = [
    { label: 'Produkty', value: data.produkty, icon: '🔧', color: C.accent },
    { label: 'Zamówienia', value: data.zamowienia, icon: '📦', color: C.blue },
    { label: 'Klienci', value: data.uzytkownicy, icon: '👤', color: C.green },
    { label: 'Przychód', value: `${parseFloat(data.przychod).toLocaleString('pl-PL')} zł`, icon: '💰', color: C.yellow },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem' }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {stats.map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
              <div style={{ fontSize: '.8rem', color: C.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '.95rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>Ostatnie zamówienia</h3>
        <Table
          cols={['ID', 'Klient', 'Kwota', 'Status', 'Data']}
          rows={data.ostatnie}
          renderRow={(z, i) => (
            <TR key={i}>
              <TD><span style={{ fontFamily: 'JetBrains Mono', color: C.muted }}>#{z.id}</span></TD>
              <TD>{z.email}</TD>
              <TD><span style={{ fontFamily: 'JetBrains Mono', color: C.accent }}>{parseFloat(z.suma_brutto).toFixed(2)} zł</span></TD>
              <TD><Badge label={z.aktualny_status} color={STATUS_COLORS[z.aktualny_status] || C.muted} /></TD>
              <TD style={{ color: C.muted }}>{new Date(z.data_zamowienia).toLocaleDateString('pl-PL')}</TD>
            </TR>
          )}
        />
      </Card>
    </div>
  );
}

function Produkty({ toast }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | produkt
  const [form, setForm] = useState({});
  const [producenci, setProducenci] = useState([]);
  const [kategorie, setKategorie] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api(`/admin/produkty?page=${page}&search=${search}`).then(setData).catch(() => {});
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api('/admin/producenci').then(setProducenci).catch(() => {});
    api('/admin/kategorie').then(setKategorie).catch(() => {});
  }, []);

  function openNew() { setForm({ sku:'', nazwa:'', cena_brutto:'', stan_magazynowy:'0', opis:'', producent_id:'', kategoria_id:'' }); setModal('new'); }
  function openEdit(p) { setForm({ ...p }); setModal(p); }

  async function save() {
    setSaving(true);
    try {
      if (modal === 'new') await api('/admin/produkty', { method: 'POST', body: JSON.stringify(form) });
      else await api(`/admin/produkty/${modal.id}`, { method: 'PUT', body: JSON.stringify(form) });
      setModal(null); load(); toast('Zapisano produkt');
    } catch (e) { alert(e.message); }
    setSaving(false);
  }

  async function del(p) {
    if (!confirm(`Usunąć „${p.nazwa}"?`)) return;
    await api(`/admin/produkty/${p.id}`, { method: 'DELETE' });
    load(); toast('Usunięto produkt');
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Produkty</h2>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <input placeholder="Szukaj…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ width: 200 }} />
          <Btn onClick={openNew}>+ Dodaj produkt</Btn>
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        {!data ? <div style={{ padding: '2rem', color: C.muted }}>Ładowanie…</div> : (
          <>
            <Table
              cols={['SKU', 'Nazwa', 'Producent', 'Kategoria', 'Cena', 'Stan', '']}
              rows={data.produkty}
              renderRow={(p, i) => (
                <TR key={i}>
                  <TD><span style={{ fontFamily: 'JetBrains Mono', fontSize: '.82rem', color: C.muted }}>{p.sku}</span></TD>
                  <TD>{p.nazwa}</TD>
                  <TD>{p.producent}</TD>
                  <TD>{p.kategoria}</TD>
                  <TD><span style={{ fontFamily: 'JetBrains Mono', color: C.accent }}>{parseFloat(p.cena_brutto).toFixed(2)} zł</span></TD>
                  <TD>
                    <Badge label={p.stan_magazynowy} color={p.stan_magazynowy > 0 ? C.green : C.red} />
                  </TD>
                  <TD>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn small variant="ghost" onClick={() => openEdit(p)}>Edytuj</Btn>
                      <Btn small variant="danger" onClick={() => del(p)}>Usuń</Btn>
                    </div>
                  </TD>
                </TR>
              )}
            />
            <div style={{ padding: '1rem' }}>
              <Pagination page={page} total={data.total} limit={20} onChange={setPage} />
            </div>
          </>
        )}
      </Card>

      {modal !== null && (
        <Modal title={modal === 'new' ? 'Nowy produkt' : `Edytuj: ${modal.nazwa}`} onClose={() => setModal(null)}>
          <Field label="SKU"><input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} style={{ width: '100%' }} /></Field>
          <Field label="Nazwa"><input value={form.nazwa} onChange={e => setForm(f => ({ ...f, nazwa: e.target.value }))} style={{ width: '100%' }} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <Field label="Cena brutto (zł)"><input type="number" step=".01" value={form.cena_brutto} onChange={e => setForm(f => ({ ...f, cena_brutto: e.target.value }))} style={{ width: '100%' }} /></Field>
            <Field label="Stan magazynowy"><input type="number" value={form.stan_magazynowy} onChange={e => setForm(f => ({ ...f, stan_magazynowy: e.target.value }))} style={{ width: '100%' }} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <Field label="Producent">
              <select value={form.producent_id} onChange={e => setForm(f => ({ ...f, producent_id: e.target.value }))} style={{ width: '100%' }}>
                <option value="">— wybierz —</option>
                {producenci.map(p => <option key={p.id} value={p.id}>{p.nazwa}</option>)}
              </select>
            </Field>
            <Field label="Kategoria">
              <select value={form.kategoria_id} onChange={e => setForm(f => ({ ...f, kategoria_id: e.target.value }))} style={{ width: '100%' }}>
                <option value="">— wybierz —</option>
                {kategorie.map(k => <option key={k.id} value={k.id}>{k.nazwa}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Opis"><textarea value={form.opis} onChange={e => setForm(f => ({ ...f, opis: e.target.value }))} rows={4} style={{ width: '100%', resize: 'vertical' }} /></Field>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Anuluj</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? 'Zapisywanie…' : 'Zapisz'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Zamowienia({ toast }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    api(`/admin/zamowienia?page=${page}${statusFilter ? '&status=' + statusFilter : ''}`).then(setData).catch(() => {});
  }, [page, statusFilter]);
  useEffect(() => { load(); }, [load]);

  async function loadDetail(id) {
    const d = await api(`/admin/zamowienia/${id}`);
    setDetail(d);
  }

  async function changeStatus(id, status) {
    await api(`/admin/zamowienia/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    toast(`Status zmieniony na: ${status}`);
    load();
    if (detail?.id === id) setDetail(d => ({ ...d, aktualny_status: status }));
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Zamówienia</h2>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Wszystkie statusy</option>
          {['nowe','oplacone','wyslane','zakonczone','anulowane'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card style={{ padding: 0 }}>
        {!data ? <div style={{ padding: '2rem', color: C.muted }}>Ładowanie…</div> : (
          <>
            <Table
              cols={['ID', 'Klient', 'Kwota', 'Status', 'Data', 'Akcje']}
              rows={data.zamowienia}
              renderRow={(z, i) => (
                <TR key={i} onClick={() => loadDetail(z.id)}>
                  <TD><span style={{ fontFamily: 'JetBrains Mono', color: C.muted }}>#{z.id}</span></TD>
                  <TD>{z.email}</TD>
                  <TD><span style={{ fontFamily: 'JetBrains Mono', color: C.accent }}>{parseFloat(z.suma_brutto).toFixed(2)} zł</span></TD>
                  <TD><Badge label={z.aktualny_status} color={STATUS_COLORS[z.aktualny_status] || C.muted} /></TD>
                  <TD style={{ color: C.muted, fontSize: '.82rem' }}>{new Date(z.data_zamowienia).toLocaleString('pl-PL')}</TD>
                  <TD onClick={e => e.stopPropagation()}>
                    <select
                      value={z.aktualny_status}
                      onChange={e => changeStatus(z.id, e.target.value)}
                      style={{ fontSize: '.8rem', padding: '.25rem .5rem' }}
                    >
                      {['nowe','oplacone','wyslane','zakonczone','anulowane'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </TD>
                </TR>
              )}
            />
            <div style={{ padding: '1rem' }}>
              <Pagination page={page} total={data.total} limit={20} onChange={setPage} />
            </div>
          </>
        )}
      </Card>

      {detail && (
        <Modal title={`Zamówienie #${detail.id}`} onClose={() => setDetail(null)}>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div><span style={{ color: C.muted, fontSize: '.8rem' }}>Klient</span><br />{detail.email}</div>
            <div><span style={{ color: C.muted, fontSize: '.8rem' }}>Suma</span><br /><span style={{ color: C.accent, fontFamily: 'JetBrains Mono' }}>{parseFloat(detail.suma_brutto).toFixed(2)} zł</span></div>
            <div><span style={{ color: C.muted, fontSize: '.8rem' }}>Status</span><br /><Badge label={detail.aktualny_status} color={STATUS_COLORS[detail.aktualny_status] || C.muted} /></div>
          </div>
          <h4 style={{ color: C.muted, fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.75rem' }}>Pozycje</h4>
          {detail.pozycje?.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '.5rem 0', borderBottom: `1px solid ${C.border}`, fontSize: '.88rem' }}>
              <span>{p.nazwa} <span style={{ color: C.muted }}>×{p.ilosc}</span></span>
              <span style={{ fontFamily: 'JetBrains Mono', color: C.accent }}>{(p.cena_jednostkowa * p.ilosc).toFixed(2)} zł</span>
            </div>
          ))}
          <h4 style={{ color: C.muted, fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.05em', margin: '1rem 0 .75rem' }}>Historia statusów</h4>
          {detail.historia?.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', fontSize: '.82rem', marginBottom: '.35rem' }}>
              <Badge label={h.status} color={STATUS_COLORS[h.status] || C.muted} />
              <span style={{ color: C.muted }}>{new Date(h.data_zmiany).toLocaleString('pl-PL')}</span>
            </div>
          ))}
          <div style={{ marginTop: '1rem' }}>
            <Field label="Zmień status">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['nowe','oplacone','wyslane','zakonczone','anulowane'].map(s => (
                  <Btn key={s} small variant={detail.aktualny_status === s ? 'primary' : 'ghost'}
                    onClick={() => changeStatus(detail.id, s)}>{s}</Btn>
                ))}
              </div>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Uzytkownicy({ toast }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    api(`/admin/uzytkownicy?page=${page}&search=${search}`).then(setData).catch(() => {});
  }, [page, search]);
  useEffect(() => { load(); }, [load]);

  async function del(u) {
    if (!confirm(`Usunąć konto ${u.email}?`)) return;
    await api(`/admin/uzytkownicy/${u.id}`, { method: 'DELETE' });
    load(); toast('Usunięto użytkownika');
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Użytkownicy</h2>
        <input placeholder="Szukaj emaila…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ width: 220 }} />
      </div>

      <Card style={{ padding: 0 }}>
        {!data ? <div style={{ padding: '2rem', color: C.muted }}>Ładowanie…</div> : (
          <>
            <Table
              cols={['ID', 'Email', 'Rola', 'Rejestracja', '']}
              rows={data.uzytkownicy}
              renderRow={(u, i) => (
                <TR key={i}>
                  <TD><span style={{ fontFamily: 'JetBrains Mono', color: C.muted }}>{u.id}</span></TD>
                  <TD>{u.email}</TD>
                  <TD><Badge label={u.rola} color={u.rola === 'admin' ? C.accent : C.blue} /></TD>
                  <TD style={{ color: C.muted, fontSize: '.82rem' }}>{u.data_rejestracji ? new Date(u.data_rejestracji).toLocaleDateString('pl-PL') : '—'}</TD>
                  <TD>{u.rola !== 'admin' && <Btn small variant="danger" onClick={() => del(u)}>Usuń</Btn>}</TD>
                </TR>
              )}
            />
            <div style={{ padding: '1rem' }}>
              <Pagination page={page} total={data.total} limit={20} onChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function Reklamacje({ toast }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(() => {
    api(`/admin/reklamacje?page=${page}${statusFilter ? '&status=' + statusFilter : ''}`).then(setData).catch(() => {});
  }, [page, statusFilter]);
  useEffect(() => { load(); }, [load]);

  async function changeStatus(id, status) {
    await api(`/admin/reklamacje/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    toast(`Status reklamacji zmieniony`);
    load();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Reklamacje</h2>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Wszystkie</option>
          {['zlozona','rozpatrywana','zakonczona'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card style={{ padding: 0 }}>
        {!data ? <div style={{ padding: '2rem', color: C.muted }}>Ładowanie…</div> : (
          <>
            <Table
              cols={['ID', 'Klient', 'Produkt', 'Opis wady', 'Status', 'Data', 'Akcje']}
              rows={data.reklamacje}
              renderRow={(r, i) => (
                <TR key={i}>
                  <TD><span style={{ fontFamily: 'JetBrains Mono', color: C.muted }}>#{r.id}</span></TD>
                  <TD>{r.email}</TD>
                  <TD style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.produkt}</TD>
                  <TD style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.muted, fontSize: '.82rem' }}>{r.opis_wady}</TD>
                  <TD><Badge label={r.status} color={STATUS_COLORS[r.status] || C.muted} /></TD>
                  <TD style={{ color: C.muted, fontSize: '.82rem' }}>{new Date(r.data_zgloszenia).toLocaleDateString('pl-PL')}</TD>
                  <TD>
                    <select value={r.status} onChange={e => changeStatus(r.id, e.target.value)} style={{ fontSize: '.8rem', padding: '.25rem .5rem' }}>
                      {['zlozona','rozpatrywana','zakonczona'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </TD>
                </TR>
              )}
            />
            <div style={{ padding: '1rem' }}>
              <Pagination page={page} total={data.total} limit={20} onChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Główny panel ─────────────────────────────────────
const TABS = [
  { key: 'dashboard',    label: '📊 Dashboard' },
  { key: 'produkty',     label: '🔧 Produkty' },
  { key: 'zamowienia',   label: '📦 Zamówienia' },
  { key: 'uzytkownicy',  label: '👤 Użytkownicy' },
  { key: 'reklamacje',   label: '⚠️ Reklamacje' },
];

export default function AdminPage({ navigate }) {
  const [tab, setTab] = useState('dashboard');
  const [toast, setToastMsg] = useState(null);
  const [sideOpen, setSideOpen] = useState(true);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  }

  return (
    <>
      <style>{css}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>

        {/* Sidebar */}
        <aside style={{
          width: sideOpen ? 220 : 60, flexShrink: 0,
          background: C.bg2, borderRight: `1px solid ${C.border}`,
          transition: 'width .25s ease',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }}>
          {/* Logo */}
          <div style={{
            padding: '1.25rem 1rem', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: '.75rem', overflow: 'hidden',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>⚙️</div>
            {sideOpen && <span style={{ fontWeight: 800, fontSize: '.95rem', color: C.text, whiteSpace: 'nowrap' }}>CZESIOMANIA<br /><span style={{ fontWeight: 500, fontSize: '.72rem', color: C.accent }}>PANEL ADMINA</span></span>}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '.75rem .5rem' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: 'flex', alignItems: 'center', gap: '.75rem',
                width: '100%', padding: '.65rem .75rem', borderRadius: 8, marginBottom: 2,
                background: tab === t.key ? `${C.accent}22` : 'transparent',
                color: tab === t.key ? C.accent : C.muted,
                border: tab === t.key ? `1px solid ${C.accent}44` : '1px solid transparent',
                fontWeight: tab === t.key ? 700 : 500, fontSize: '.88rem',
                textAlign: 'left', transition: 'all .15s', overflow: 'hidden', whiteSpace: 'nowrap',
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{t.label.split(' ')[0]}</span>
                {sideOpen && <span>{t.label.split(' ').slice(1).join(' ')}</span>}
              </button>
            ))}
          </nav>

          {/* Bottom */}
          <div style={{ padding: '.75rem .5rem', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={() => setSideOpen(s => !s)} style={{
              display: 'flex', alignItems: 'center', gap: '.75rem',
              width: '100%', padding: '.6rem .75rem', borderRadius: 8,
              background: 'transparent', color: C.muted, border: 'none',
              fontSize: '.85rem', cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap',
            }}>
              <span style={{ flexShrink: 0 }}>{sideOpen ? '◀' : '▶'}</span>
              {sideOpen && <span>Zwiń</span>}
            </button>
            <button onClick={() => navigate('shop')} style={{
              display: 'flex', alignItems: 'center', gap: '.75rem',
              width: '100%', padding: '.6rem .75rem', borderRadius: 8,
              background: 'transparent', color: C.muted, border: 'none',
              fontSize: '.85rem', cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap',
            }}>
              <span style={{ flexShrink: 0 }}>🏪</span>
              {sideOpen && <span>Wróć do sklepu</span>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: '2rem', overflowX: 'hidden', minWidth: 0 }}>
          {tab === 'dashboard'   && <Dashboard />}
          {tab === 'produkty'    && <Produkty toast={showToast} />}
          {tab === 'zamowienia'  && <Zamowienia toast={showToast} />}
          {tab === 'uzytkownicy' && <Uzytkownicy toast={showToast} />}
          {tab === 'reklamacje'  && <Reklamacje toast={showToast} />}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: C.bg3, border: `1px solid ${C.green}44`,
          color: C.green, borderRadius: 10, padding: '.75rem 1.25rem',
          fontWeight: 600, fontSize: '.88rem', boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          animation: 'fadeIn .3s ease both',
        }}>✓ {toast}</div>
      )}
    </>
  );
}
