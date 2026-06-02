import { Router } from 'express';
import pool from '../db/pool.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// ── MÓJ GARAŻ ─────────────────────────────────────────────

// GET /api/konto/garaz
router.get('/garaz', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT mg.id, mg.nazwa_wlasna,
             m.nazwa AS marka, mo.nazwa AS model, mo.lata_produkcji,
             ts.pojemnosc, ts.moc_km, ts.paliwo
      FROM moj_garaz mg
      JOIN typy_silnikowe ts ON ts.id = mg.typ_silnikowy_id
      JOIN modele mo ON mo.id = ts.model_id
      JOIN marki m ON m.id = mo.marka_id
      WHERE mg.uzytkownik_id = ?
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/konto/garaz — dodaj pojazd
router.post('/garaz', authRequired, async (req, res) => {
  try {
    const { typ_silnikowy_id, nazwa_wlasna } = req.body;
    if (!typ_silnikowy_id) return res.status(400).json({ error: 'Brak typ_silnikowy_id' });
    await pool.query(
      'INSERT INTO moj_garaz (uzytkownik_id, typ_silnikowy_id, nazwa_wlasna) VALUES (?, ?, ?)',
      [req.user.id, typ_silnikowy_id, nazwa_wlasna || null]
    );
    res.status(201).json({ message: 'Pojazd dodany' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// DELETE /api/konto/garaz/:id
router.delete('/garaz/:id', authRequired, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM moj_garaz WHERE id = ? AND uzytkownik_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Usunięto' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ── ADRESY ───────────────────────────────────────────────

// GET /api/konto/adresy
router.get('/adresy', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM adresy_uzytkownikow WHERE uzytkownik_id = ?',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/konto/adresy
router.post('/adresy', authRequired, async (req, res) => {
  try {
    const { typ_adresu, ulica, miasto, kod_pocztowy, kraj = 'Polska' } = req.body;
    await pool.query(
      'INSERT INTO adresy_uzytkownikow (uzytkownik_id, typ_adresu, ulica, miasto, kod_pocztowy, kraj) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, typ_adresu, ulica, miasto, kod_pocztowy, kraj]
    );
    res.status(201).json({ message: 'Adres dodany' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ── MARKI + MODELE + TYPY (dla formularza garażu) ───────

// GET /api/konto/marki
router.get('/marki', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nazwa FROM marki ORDER BY nazwa');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/konto/modele?marka_id=X
router.get('/modele', async (req, res) => {
  try {
    const { marka_id } = req.query;
    const [rows] = await pool.query(
      'SELECT id, nazwa, lata_produkcji FROM modele WHERE marka_id = ? ORDER BY nazwa',
      [marka_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/konto/typy?model_id=X
router.get('/typy', async (req, res) => {
  try {
    const { model_id } = req.query;
    const [rows] = await pool.query(
      'SELECT id, pojemnosc, moc_km, paliwo FROM typy_silnikowe WHERE model_id = ? ORDER BY pojemnosc',
      [model_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
