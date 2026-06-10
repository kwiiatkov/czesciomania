import { Router } from 'express';
import pool from '../db/pool.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// GET /api/reklamacje — reklamacje zalogowanego użytkownika
router.get('/', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.zamowienie_id, r.produkt_id, r.opis_wady,
             r.status, r.data_zgloszenia,
             p.nazwa AS produkt_nazwa, p.sku
      FROM reklamacje r
      JOIN produkty p ON p.id = r.produkt_id
      WHERE r.uzytkownik_id = ?
      ORDER BY r.data_zgloszenia DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/reklamacje — złóż nową reklamację
router.post('/', authRequired, async (req, res) => {
  try {
    const { zamowienie_id, produkt_id, opis_wady } = req.body;

    if (!zamowienie_id || !produkt_id || !opis_wady?.trim()) {
      return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
    }

    // Sprawdź czy zamówienie należy do użytkownika i zawiera produkt
    const [[pozycja]] = await pool.query(`
      SELECT pz.id FROM pozycje_zamowienia pz
      JOIN zamowienia z ON z.id = pz.zamowienie_id
      WHERE z.id = ? AND z.uzytkownik_id = ? AND pz.produkt_id = ?
    `, [zamowienie_id, req.user.id, produkt_id]);

    if (!pozycja) {
      return res.status(400).json({ error: 'Nie znaleziono produktu w tym zamówieniu' });
    }

    const [result] = await pool.query(`
      INSERT INTO reklamacje (zamowienie_id, uzytkownik_id, produkt_id, opis_wady, status)
      VALUES (?, ?, ?, ?, 'zlozona')
    `, [zamowienie_id, req.user.id, produkt_id, opis_wady.trim()]);

    res.status(201).json({ message: 'Reklamacja złożona', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
