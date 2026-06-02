import { useState, useEffect } from 'react';
import { kategorieApi } from '../api/index.js';

const S = {
  wrap: {
    width: '220px', flexShrink: 0,
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '1.25rem',
    height: 'fit-content',
  },
  title: { fontSize: '.7rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.9rem' },
  parent: (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '.5rem .6rem', borderRadius: '8px', cursor: 'pointer',
    background: active ? 'rgba(0,212,255,0.1)' : 'none',
    color: active ? 'var(--accent)' : 'var(--text)',
    fontSize: '.88rem', fontWeight: 600,
    border: 'none', width: '100%', textAlign: 'left',
    transition: 'all .15s',
  }),
  child: (active) => ({
    display: 'block', padding: '.35rem .6rem .35rem 1.5rem',
    borderRadius: '6px', cursor: 'pointer',
    background: active ? 'rgba(0,212,255,0.08)' : 'none',
    color: active ? 'var(--accent)' : 'var(--text2)',
    fontSize: '.83rem', fontWeight: active ? 600 : 400,
    border: 'none', width: '100%', textAlign: 'left',
    transition: 'all .15s',
  }),
  resetBtn: {
    marginTop: '1rem', width: '100%',
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: 'var(--red)', borderRadius: '8px',
    padding: '.5rem', fontSize: '.82rem', fontWeight: 600,
    cursor: 'pointer',
  },
};

export default function Sidebar({ activeCategory, onSelect }) {
  const [tree, setTree] = useState([]);
  const [open, setOpen] = useState({});

  useEffect(() => {
    kategorieApi.lista().then(data => {
      setTree(data);
      // Automatycznie otwórz sekcję z aktywną kategorią
      if (activeCategory) {
        const parent = data.find(p => p.children?.some(c => c.id === activeCategory));
        if (parent) setOpen(o => ({ ...o, [parent.id]: true }));
      }
    });
  }, []);

  function toggleParent(id) {
    setOpen(o => ({ ...o, [id]: !o[id] }));
  }

  function handleSelect(id) {
    onSelect(activeCategory === id ? null : id);
  }

  return (
    <aside style={S.wrap}>
      <div style={S.title}>Kategorie</div>

      {tree.map(parent => (
        <div key={parent.id}>
          <button
            style={S.parent(activeCategory === parent.id)}
            onClick={() => {
              toggleParent(parent.id);
              handleSelect(parent.id);
            }}
          >
            <span>{parent.nazwa}</span>
            <span style={{ fontSize: '.7rem', opacity: .6 }}>
              {open[parent.id] ? '▲' : '▼'}
            </span>
          </button>

          {open[parent.id] && parent.children?.map(child => (
            <button
              key={child.id}
              style={S.child(activeCategory === child.id)}
              onClick={() => handleSelect(child.id)}
            >
              {child.nazwa}
            </button>
          ))}
        </div>
      ))}

      {activeCategory && (
        <button style={S.resetBtn} onClick={() => onSelect(null)}>
          ✕ Wyczyść filtr
        </button>
      )}
    </aside>
  );
}
