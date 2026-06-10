const S = {
  footer: {
    marginTop: '5rem',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(13,18,32,0.6)',
    backdropFilter: 'blur(8px)',
    padding: '3rem 2rem 1.5rem',
  },
  inner: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '2rem',
    marginBottom: '2.5rem',
  },
  colTitle: {
    fontSize: '.7rem',
    fontWeight: 700,
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '.1em',
    marginBottom: '1rem',
  },
  link: {
    display: 'block',
    color: 'var(--text2)',
    fontSize: '.85rem',
    marginBottom: '.5rem',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'color .15s',
    fontFamily: 'inherit',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: 800,
    letterSpacing: '-.03em',
    marginBottom: '.6rem',
  },
  tagline: {
    fontSize: '.82rem',
    color: 'var(--text3)',
    lineHeight: 1.6,
    maxWidth: '220px',
  },
  divider: {
    borderColor: 'rgba(255,255,255,0.06)',
    margin: '0 0 1.25rem',
  },
  bottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '.75rem',
  },
  copy: {
    fontSize: '.78rem',
    color: 'var(--text3)',
  },
  badges: {
    display: 'flex',
    gap: '.5rem',
    flexWrap: 'wrap',
  },
  badge: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px',
    padding: '.2rem .6rem',
    fontSize: '.72rem',
    color: 'var(--text3)',
    fontWeight: 600,
  },
};

export default function Footer({ navigate }) {
  const year = new Date().getFullYear();

  return (
    <footer style={S.footer}>
      <div style={S.inner}>
        <div style={S.grid}>

          {/* Brand */}
          <div>
            <div style={S.logo}>
              <span style={{ color: 'var(--accent)' }}>Części</span>omania
            </div>
            <div style={S.tagline}>
              Sklep z częściami samochodowymi — tanie, sprawdzone, szybka wysyłka.
            </div>
          </div>

          {/* Sklep */}
          <div>
            <div style={S.colTitle}>Sklep</div>
            <button style={S.link} onClick={() => navigate('shop')}>Wszystkie produkty</button>
            <button style={S.link} onClick={() => navigate('shop')}>Nowości</button>
            <button style={S.link} onClick={() => navigate('cart')}>Koszyk</button>
          </div>

          {/* Konto */}
          <div>
            <div style={S.colTitle}>Konto</div>
            <button style={S.link} onClick={() => navigate('account')}>Moje konto</button>
            <button style={S.link} onClick={() => navigate('orders')}>Zamówienia</button>
            <button style={S.link} onClick={() => navigate('account')}>Mój garaż</button>
            <button style={S.link} onClick={() => navigate('account')}>Reklamacje</button>
          </div>

          {/* Pomoc */}
          <div>
            <div style={S.colTitle}>Pomoc</div>
            <span style={{ ...S.link, cursor: 'default' }}>Wysyłka i zwroty</span>
            <span style={{ ...S.link, cursor: 'default' }}>Polityka prywatności</span>
            <span style={{ ...S.link, cursor: 'default' }}>Regulamin</span>
            <span style={{ ...S.link, cursor: 'default' }}>Kontakt</span>
          </div>

        </div>

        <hr style={S.divider} />

        <div style={S.bottom}>
          <div style={S.copy}>© {year} Częściomania. Wszelkie prawa zastrzeżone.</div>
          <div style={S.badges}>
            <span style={S.badge}>🔒 SSL</span>
            <span style={S.badge}>📦 Szybka wysyłka</span>
            <span style={S.badge}>🔄 14-dni zwrotu</span>
            <span style={S.badge}>💳 Bezpieczne płatności</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
