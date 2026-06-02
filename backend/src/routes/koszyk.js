import { Router } from 'express';
import pool from '../db/pool.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// GET /api/koszyk — pobierz koszyk zalogowanego użytkownika
router.get('/', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT k.id, k.ilosc,
             p.id AS produkt_id, p.nazwa, p.cena_brutto, p.sku, p.stan_magazynowy,
             pr.nazwa AS producent
      FROM koszyk k
      JOIN produkty p ON p.id = k.produkt_id
      JOIN producenci pr ON pr.id = p.producent_id
      WHERE k.uzytkownik_id = ?
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/koszyk — dodaj lub zwiększ ilość
router.post('/', authRequired, async (req, res) => {
  try {
    const { produkt_id, ilosc = 1 } = req.body;
    if (!produkt_id) return res.status(400).json({ error: 'Brak produkt_id' });

    // Sprawdź czy jest w magazynie
    const [[produkt]] = await pool.query(
      'SELECT stan_magazynowy FROM produkty WHERE id = ?',
      [produkt_id]
    );
    if (!produkt) return res.status(404).json({ error: 'Produkt nie znaleziony' });

    // Upsert
    const [[existing]] = await pool.query(
      'SELECT id, ilosc FROM koszyk WHERE uzytkownik_id = ? AND produkt_id = ?',
      [req.user.id, produkt_id]
    );

    if (existing) {
      const nowaIlosc = Math.min(existing.ilosc + parseInt(ilosc), produkt.stan_magazynowy);
      await pool.query('UPDATE koszyk SET ilosc = ? WHERE id = ?', [nowaIlosc, existing.id]);
    } else {
      await pool.query(
        'INSERT INTO koszyk (uzytkownik_id, produkt_id, ilosc) VALUES (?, ?, ?)',
        [req.user.id, produkt_id, Math.min(parseInt(ilosc), produkt.stan_magazynowy)]
      );
    }

    res.json({ message: 'Dodano do koszyka' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// PATCH /api/koszyk/:id — zmień ilość
router.patch('/:id', authRequired, async (req, res) => {
  try {
    const { ilosc } = req.body;
    if (!ilosc || ilosc < 1) {
      return res.status(400).json({ error: 'Ilość musi być ≥ 1' });
    }
    await pool.query(
      'UPDATE koszyk SET ilosc = ? WHERE id = ? AND uzytkownik_id = ?',
      [ilosc, req.params.id, req.user.id]
    );
    res.json({ message: 'Zaktualizowano' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// DELETE /api/koszyk/:id — usuń pozycję
router.delete('/:id', authRequired, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM koszyk WHERE id = ? AND uzytkownik_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Usunięto' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// DELETE /api/koszyk — wyczyść cały koszyk
router.delete('/', authRequired, async (req, res) => {
  try {
    await pool.query('DELETE FROM koszyk WHERE uzytkownik_id = ?', [req.user.id]);
    res.json({ message: 'Koszyk wyczyszczony' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
