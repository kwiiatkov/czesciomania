// Centralny klient API — wszystkie wywołania backendu przez ten moduł

const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

function getToken() {
  return localStorage.getItem('czesciomania_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Błąd HTTP ${res.status}`);
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────

export const authApi = {
  login:    (email, haslo) => request('/auth/login',    { method: 'POST', body: JSON.stringify({ email, haslo }) }),
  register: (email, haslo, imie_nazwisko) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, haslo, imie_nazwisko }) }),
  me:       () => request('/auth/me'),
};

// ── Produkty ──────────────────────────────────────────

export const produktyApi = {
  lista: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return request(`/produkty${qs ? '?' + qs : ''}`);
  },
  szczegoly: (id) => request(`/produkty/${id}`),
};

// ── Kategorie ─────────────────────────────────────────

export const kategorieApi = {
  lista: () => request('/kategorie'),
};

// ── Koszyk ────────────────────────────────────────────

export const koszykApi = {
  pobierz:  () => request('/koszyk'),
  dodaj:    (produkt_id, ilosc = 1) => request('/koszyk', { method: 'POST', body: JSON.stringify({ produkt_id, ilosc }) }),
  zmienIlosc: (id, ilosc) => request(`/koszyk/${id}`, { method: 'PATCH', body: JSON.stringify({ ilosc }) }),
  usun:     (id) => request(`/koszyk/${id}`, { method: 'DELETE' }),
  wyczysc:  () => request('/koszyk', { method: 'DELETE' }),
};

// ── Zamówienia ────────────────────────────────────────

export const zamowieniaApi = {
  lista:   () => request('/zamowienia'),
  zloz:    (payload) => request('/zamowienia', { method: 'POST', body: JSON.stringify(payload) }),
};

// ── Konto ─────────────────────────────────────────────

export const kontoApi = {
  garaz:       () => request('/konto/garaz'),
  dodajAuto:   (payload) => request('/konto/garaz', { method: 'POST', body: JSON.stringify(payload) }),
  usunAuto:    (id) => request(`/konto/garaz/${id}`, { method: 'DELETE' }),
  adresy:      () => request('/konto/adresy'),
  dodajAdres:  (payload) => request('/konto/adresy', { method: 'POST', body: JSON.stringify(payload) }),
  marki:       () => request('/konto/marki'),
  modele:      (marka_id) => request(`/konto/modele?marka_id=${marka_id}`),
  typy:        (model_id) => request(`/konto/typy?model_id=${model_id}`),
};
