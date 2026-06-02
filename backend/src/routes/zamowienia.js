import { Router } from 'express';
import pool from '../db/pool.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// GET /api/zamowienia — zamówienia zalogowanego użytkownika
router.get('/', authRequired, async (req, res) => {
  try {
    const [zamowienia] = await pool.query(`
      SELECT z.id, z.suma_brutto, z.data_zamowienia, z.aktualny_status,
             pr.kod_rabatowy, pr.procent_znizki
      FROM zamowienia z
      LEFT JOIN promocje pr ON pr.id = z.promocja_id
      WHERE z.uzytkownik_id = ?
      ORDER BY z.data_zamowienia DESC
    `, [req.user.id]);

    // Pobierz pozycje dla każdego zamówienia
    for (const z of zamowienia) {
      const [pozycje] = await pool.query(`
        SELECT pz.ilosc, pz.cena_jednostkowa,
               p.nazwa, p.sku, pr2.nazwa AS producent
        FROM pozycje_zamowienia pz
        JOIN produkty p ON p.id = pz.produkt_id
        JOIN producenci pr2 ON pr2.id = p.producent_id
        WHERE pz.zamowienie_id = ?
      `, [z.id]);
      z.pozycje = pozycje;
    }

    res.json(zamowienia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/zamowienia — złóż zamówienie z koszyka
router.post('/', authRequired, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { kod_rabatowy, adres_id } = req.body;

    // Pobierz koszyk
    const [koszyk] = await conn.query(`
      SELECT k.id AS koszyk_id, k.ilosc, p.id AS produkt_id,
             p.cena_brutto, p.stan_magazynowy, p.nazwa
      FROM koszyk k
      JOIN produkty p ON p.id = k.produkt_id
      WHERE k.uzytkownik_id = ?
    `, [req.user.id]);

    if (!koszyk.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'Koszyk jest pusty' });
    }

    // Sprawdź stany
    for (const item of koszyk) {
      if (item.ilosc > item.stan_magazynowy) {
        await conn.rollback();
        return res.status(400).json({
          error: `Niewystarczający stan magazynowy: ${item.nazwa}`,
        });
      }
    }

    // Oblicz sumę
    let suma = koszyk.reduce((s, i) => s + i.cena_brutto * i.ilosc, 0);
    let promocja_id = null;

    // Kod rabatowy
    if (kod_rabatowy) {
      const [[promo]] = await conn.query(`
        SELECT id, procent_znizki FROM promocje
        WHERE kod_rabatowy = ? AND aktywna = 1 AND data_waznosci >= CURDATE()
      `, [kod_rabatowy]);
      if (!promo) {
        await conn.rollback();
        return res.status(400).json({ error: 'Nieprawidłowy lub wygasły kod rabatowy' });
      }
      suma = suma * (1 - promo.procent_znizki / 100);
      promocja_id = promo.id;
    }

    // Utwórz zamówienie
    const [zamResult] = await conn.query(`
      INSERT INTO zamowienia (uzytkownik_id, promocja_id, suma_brutto, aktualny_status)
      VALUES (?, ?, ?, 'nowe')
    `, [req.user.id, promocja_id, suma.toFixed(2)]);

    const zamowienie_id = zamResult.insertId;

    // Dodaj historię statusu
    await conn.query(
      'INSERT INTO historia_statusow (zamowienie_id, status) VALUES (?, ?)',
      [zamowienie_id, 'nowe']
    );

    // Dodaj pozycje i zaktualizuj stany
    for (const item of koszyk) {
      await conn.query(`
        INSERT INTO pozycje_zamowienia (zamowienie_id, produkt_id, ilosc, cena_jednostkowa)
        VALUES (?, ?, ?, ?)
      `, [zamowienie_id, item.produkt_id, item.ilosc, item.cena_brutto]);

      await conn.query(
        'UPDATE produkty SET stan_magazynowy = stan_magazynowy - ? WHERE id = ?',
        [item.ilosc, item.produkt_id]
      );
    }

    // Wyczyść koszyk
    await conn.query('DELETE FROM koszyk WHERE uzytkownik_id = ?', [req.user.id]);

    await conn.commit();
    res.status(201).json({ message: 'Zamówienie złożone', zamowienie_id, suma: suma.toFixed(2) });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  } finally {
    conn.release();
  }
});

export default router;
