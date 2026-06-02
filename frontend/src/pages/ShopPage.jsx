import { useState, useEffect, useCallback } from 'react';
import { produktyApi } from '../api/index.js';
import Sidebar from '../components/Sidebar.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductModal from '../components/ProductModal.jsx';

const S = {
  page: { display: 'flex', gap: '1.5rem', padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' },
  main: { flex: 1, minWidth: 0 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '.75rem' },
  count: { fontSize: '.85rem', color: 'var(--text3)' },
  sort: { background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', padding: '.45rem .8rem', fontSize: '.83rem', cursor: 'pointer', width: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' },
  pagination: { display: 'flex', justifyContent: 'center', gap: '.5rem', marginTop: '2rem', flexWrap: 'wrap' },
  pageBtn: (active) => ({
    background: active ? 'var(--accent)' : 'var(--bg2)',
    color: active ? '#070b13' : 'var(--text2)',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: '8px', padding: '.4rem .85rem', fontSize: '.83rem', fontWeight: 600, cursor: 'pointer',
  }),
  empty: { color: 'var(--text3)', textAlign: 'center' },
};

export default function ShopPage({ searchQuery, setToast, navigate }) {
  const [produkty, setProdukty] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('id_asc');
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const LIMIT = 24;

  const fetchProdukty = useCallback(async () => {
    setLoading(true);
    try {
      const data = await produktyApi.lista({
        search: searchQuery,
        kategoria_id: activeCategory || '',
        sort,
        page,
        limit: LIMIT,
      });
      setProdukty(data.produkty);
      setTotal(data.total);
    } catch (err) {
      setToast('Błąd ładowania produktów: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory, sort, page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeCategory, sort]);

  useEffect(() => {
    fetchProdukty();
  }, [fetchProdukty]);

  const totalPages = Math.ceil(total / LIMIT);

  function handleCategorySelect(id) {
    setActiveCategory(id);
  }

  return (
    <div style={S.page}>
      <Sidebar activeCategory={activeCategory} onSelect={handleCategorySelect} />

      <main style={S.main}>
        <div style={S.topBar}>
          <span style={S.count}>
            {loading ? 'Ładowanie...' : `${total} produktów`}
            {activeCategory && ' (filtrowane)'}
          </span>
          <select style={S.sort} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="id_asc">Domyślne</option>
            <option value="cena_asc">Cena: rosnąco</option>
            <option value="cena_desc">Cena: malejąco</option>
            <option value="nazwa_asc">Nazwa: A–Z</option>
            <option value="nazwa_desc">Nazwa: Z–A</option>
          </select>
        </div>

        {loading ? (
          <div style={S.center}><div className="spinner" /></div>
        ) : produkty.length === 0 ? (
          <div style={{ ...S.center, ...S.empty }}>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
              <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>Brak wyników</div>
              <div style={{ fontSize: '.85rem' }}>Spróbuj zmienić kryteria wyszukiwania</div>
            </div>
          </div>
        ) : (
          <>
            <div style={S.grid} className="animate-fadeIn">
              {produkty.map(p => (
                <ProductCard
                  key={p.id}
                  produkt={p}
                  onOpen={setSelectedProduct}
                  setToast={setToast}
                  navigate={navigate}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={S.pagination}>
                <button style={S.pageBtn(false)} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>←</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} style={S.pageBtn(page === p)} onClick={() => setPage(p)}>{p}</button>
                  );
                })}
                <button style={S.pageBtn(false)} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>→</button>
              </div>
            )}
          </>
        )}
      </main>

      {selectedProduct && (
        <ProductModal
          produkt={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          setToast={setToast}
          navigate={navigate}
        />
      )}
    </div>
  );
}
