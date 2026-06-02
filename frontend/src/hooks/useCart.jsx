import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { koszykApi } from '../api/index.js';
import { useAuth } from './useAuth.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const data = await koszykApi.pobierz();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  async function dodaj(produkt_id, ilosc = 1) {
    await koszykApi.dodaj(produkt_id, ilosc);
    await refresh();
  }

  async function zmienIlosc(id, ilosc) {
    await koszykApi.zmienIlosc(id, ilosc);
    await refresh();
  }

  async function usun(id) {
    await koszykApi.usun(id);
    await refresh();
  }

  async function wyczysc() {
    await koszykApi.wyczysc();
    setItems([]);
  }

  const count = items.reduce((s, i) => s + i.ilosc, 0);
  const suma  = items.reduce((s, i) => s + i.cena_brutto * i.ilosc, 0);

  return (
    <CartContext.Provider value={{ items, count, suma, loading, dodaj, zmienIlosc, usun, wyczysc, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
