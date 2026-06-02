import { useState } from 'react';
import { authApi } from '../api/index.js';
import { useAuth } from '../hooks/useAuth.jsx';

const S = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '2rem' },
  card: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '2.5rem',
    width: '100%', maxWidth: '420px',
    animation: 'slideUp .35s ease both',
  },
  logo: { fontSize: '1.4rem', fontWeight: 800, marginBottom: '.5rem' },
  subtitle: { fontSize: '.88rem', color: 'var(--text3)', marginBottom: '2rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'var(--text2)', marginBottom: '.4rem', textTransform: 'uppercase', letterSpacing: '.05em' },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '.7rem 1rem', fontSize: '.85rem', color: '#f87171', marginBottom: '1rem' },
  btn: (loading) => ({
    width: '100%', padding: '.85rem',
    background: loading ? 'rgba(0,212,255,0.5)' : 'var(--accent)',
    color: '#070b13', border: 'none', borderRadius: '10px',
    fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '.5rem', transition: 'opacity .2s',
  }),
  switch: { textAlign: 'center', marginTop: '1.5rem', fontSize: '.85rem', color: 'var(--text3)' },
  switchLink: { color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 'inherit' },
  divider: { display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0', color: 'var(--text3)', fontSize: '.8rem' },
  divLine: { flex: 1, height: '1px', background: 'var(--border)' },
};

export default function LoginPage({ navigate }) {
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [haslo, setHaslo] = useState('');
  const [haslo2, setHaslo2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!email || !haslo) { setError('Uzupełnij wszystkie pola'); return; }
    if (mode === 'register' && haslo !== haslo2) { setError('Hasła nie są identyczne'); return; }
    if (mode === 'register' && haslo.length < 6) { setError('Hasło musi mieć co najmniej 6 znaków'); return; }

    setLoading(true);
    try {
      const res = mode === 'login'
        ? await authApi.login(email, haslo)
        : await authApi.register(email, haslo);
      login(res.token, res.user);
      navigate('shop');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <span style={{ color: 'var(--accent)' }}>Części</span>omania
        </div>
        <div style={S.subtitle}>
          {mode === 'login' ? 'Zaloguj się do swojego konta' : 'Utwórz nowe konto'}
        </div>

        {error && <div style={S.error}>⚠ {error}</div>}

        <div style={S.field}>
          <label style={S.label}>Adres e-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@example.com" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        <div style={S.field}>
          <label style={S.label}>Hasło</label>
          <input type="password" value={haslo} onChange={e => setHaslo(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {mode === 'register' && (
          <div style={S.field}>
            <label style={S.label}>Powtórz hasło</label>
            <input type="password" value={haslo2} onChange={e => setHaslo2(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
        )}

        <button style={S.btn(loading)} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Proszę czekać...' : mode === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
        </button>

        <div style={S.switch}>
          {mode === 'login' ? (
            <>Nie masz konta? <button style={S.switchLink} onClick={() => { setMode('register'); setError(''); }}>Zarejestruj się</button></>
          ) : (
            <>Masz już konto? <button style={S.switchLink} onClick={() => { setMode('login'); setError(''); }}>Zaloguj się</button></>
          )}
        </div>
      </div>
    </div>
  );
}
