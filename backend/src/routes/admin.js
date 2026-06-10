import { Router } from 'express';
import pool from '../db/pool.js';
import { adminRequired } from '../middleware/auth.js';

const router = Router();
// Wszystkie endpointy wymagają roli admin
router.use(adminRequired);

// ─── DASHBOARD ────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const [[{ produkty }]] = await pool.query('SELECT COUNT(*) AS produkty FROM produkty');
    const [[{ zamowienia }]] = await pool.query('SELECT COUNT(*) AS zamowienia FROM zamowienia');
    const [[{ uzytkownicy }]] = await pool.query("SELECT COUNT(*) AS uzytkownicy FROM uzytkownicy WHERE rola='klient'");
    const [[{ przychod }]] = await pool.query("SELECT COALESCE(SUM(suma_brutto),0) AS przychod FROM zamowienia WHERE aktualny_status != 'anulowane'");
    const [ostatnie] = await pool.query(`
      SELECT z.id, z.suma_brutto, z.aktualny_status, z.data_zamowienia, u.email
      FROM zamowienia z JOIN uzytkownicy u ON u.id = z.uzytkownik_id
      ORDER BY z.data_zamowienia DESC LIMIT 5
    `);
    res.json({ produkty, zamowienia, uzytkownicy, przychod, ostatnie });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

// ─── PRODUKTY ─────────────────────────────────────────
router.get('/produkty', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = '';
    if (search) { where = 'WHERE p.nazwa LIKE ? OR p.sku LIKE ?'; params.push(`%${search}%`, `%${search}%`); }
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM produkty p ${where}`, params);
    const [rows] = await pool.query(`
      SELECT p.id, p.sku, p.nazwa, p.cena_brutto, p.stan_magazynowy,
             pr.nazwa AS producent, k.nazwa AS kategoria
      FROM produkty p
      LEFT JOIN producenci pr ON pr.id = p.producent_id
      LEFT JOIN kategorie k ON k.id = p.kategoria_id
      ${where} ORDER BY p.id DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    res.json({ total, page: parseInt(page), produkty: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

router.get('/produkty/:id', async (req, res) => {
  try {
    const [[p]] = await pool.query(`
      SELECT p.*, pr.nazwa AS producent_nazwa, k.nazwa AS kategoria_nazwa
      FROM produkty p
      LEFT JOIN producenci pr ON pr.id = p.producent_id
      LEFT JOIN kategorie k ON k.id = p.kategoria_id
      WHERE p.id = ?`, [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Nie znaleziono' });
    res.json(p);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

router.post('/produkty', async (req, res) => {
  try {
    const { sku, nazwa, cena_brutto, stan_magazynowy, opis, producent_id, kategoria_id } = req.body;
    const [r] = await pool.query(
      'INSERT INTO produkty (sku,nazwa,cena_brutto,stan_magazynowy,opis,producent_id,kategoria_id) VALUES (?,?,?,?,?,?,?)',
      [sku, nazwa, cena_brutto, stan_magazynowy || 0, opis || '', producent_id, kategoria_id]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

router.put('/produkty/:id', async (req, res) => {
  try {
    const { sku, nazwa, cena_brutto, stan_magazynowy, opis, producent_id, kategoria_id } = req.body;
    await pool.query(
      'UPDATE produkty SET sku=?,nazwa=?,cena_brutto=?,stan_magazynowy=?,opis=?,producent_id=?,kategoria_id=? WHERE id=?',
      [sku, nazwa, cena_brutto, stan_magazynowy, opis, producent_id, kategoria_id, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

router.delete('/produkty/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM produkty WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

// ─── ZAMÓWIENIA ───────────────────────────────────────
router.get('/zamowienia', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = '';
    if (status) { where = 'WHERE z.aktualny_status = ?'; params.push(status); }
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM zamowienia z ${where}`, params);
    const [rows] = await pool.query(`
      SELECT z.id, z.suma_brutto, z.aktualny_status, z.data_zamowienia, u.email
      FROM zamowienia z JOIN uzytkownicy u ON u.id = z.uzytkownik_id
      ${where} ORDER BY z.data_zamowienia DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    res.json({ total, page: parseInt(page), zamowienia: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

router.get('/zamowienia/:id', async (req, res) => {
  try {
    const [[z]] = await pool.query(`
      SELECT z.*, u.email FROM zamowienia z JOIN uzytkownicy u ON u.id = z.uzytkownik_id WHERE z.id = ?
    `, [req.params.id]);
    if (!z) return res.status(404).json({ error: 'Nie znaleziono' });
    const [pozycje] = await pool.query(`
      SELECT pz.ilosc, pz.cena_jednostkowa, p.nazwa, p.sku
      FROM pozycje_zamowienia pz JOIN produkty p ON p.id = pz.produkt_id
      WHERE pz.zamowienie_id = ?
    `, [req.params.id]);
    const [historia] = await pool.query(
      'SELECT status, data_zmiany FROM historia_statusow WHERE zamowienie_id = ? ORDER BY data_zmiany',
      [req.params.id]
    );
    res.json({ ...z, pozycje, historia });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

router.patch('/zamowienia/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['nowe', 'oplacone', 'wyslane', 'zakonczone', 'anulowane'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Nieprawidłowy status' });
    await pool.query('UPDATE zamowienia SET aktualny_status = ? WHERE id = ?', [status, req.params.id]);
    await pool.query('INSERT INTO historia_statusow (zamowienie_id, status) VALUES (?, ?)', [req.params.id, status]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

// ─── UŻYTKOWNICY ──────────────────────────────────────
router.get('/uzytkownicy', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = '';
    if (search) { where = 'WHERE email LIKE ?'; params.push(`%${search}%`); }
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM uzytkownicy ${where}`, params);
    const [rows] = await pool.query(`
      SELECT id, email, rola, data_rejestracji FROM uzytkownicy ${where}
      ORDER BY data_rejestracji DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    res.json({ total, page: parseInt(page), uzytkownicy: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

router.delete('/uzytkownicy/:id', async (req, res) => {
  try {
    if (req.params.id == req.user.id) return res.status(400).json({ error: 'Nie możesz usunąć własnego konta' });
    await pool.query('DELETE FROM uzytkownicy WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

// ─── POMOCNICZE (słowniki) ────────────────────────────
router.get('/producenci', async (_req, res) => {
  try { const [r] = await pool.query('SELECT id, nazwa FROM producenci ORDER BY nazwa'); res.json(r); }
  catch (err) { res.status(500).json({ error: 'Błąd serwera' }); }
});

router.get('/kategorie', async (_req, res) => {
  try { const [r] = await pool.query('SELECT id, nazwa, parent_id FROM kategorie ORDER BY nazwa'); res.json(r); }
  catch (err) { res.status(500).json({ error: 'Błąd serwera' }); }
});

router.get('/reklamacje', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = '';
    if (status) { where = 'WHERE r.status = ?'; params.push(status); }
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM reklamacje r ${where}`, params);
    const [rows] = await pool.query(`
      SELECT r.id, r.status, r.opis_wady, r.data_zgloszenia,
             u.email, p.nazwa AS produkt
      FROM reklamacje r
      JOIN uzytkownicy u ON u.id = r.uzytkownik_id
      JOIN produkty p ON p.id = r.produkt_id
      ${where} ORDER BY r.data_zgloszenia DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    res.json({ total, page: parseInt(page), reklamacje: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

router.patch('/reklamacje/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['zlozona', 'rozpatrywana', 'zakonczona'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Nieprawidłowy status' });
    await pool.query('UPDATE reklamacje SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Błąd serwera' }); }
});

export default router;
