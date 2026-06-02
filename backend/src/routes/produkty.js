import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

// GET /api/produkty — lista z filtrowaniem, wyszukiwaniem i paginacją
router.get('/', async (req, res) => {
  try {
    const {
      search = '',
      kategoria_id,
      producent_id,
      cena_min,
      cena_max,
      tagi,
      page = 1,
      limit = 24,
      sort = 'id_asc',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const where = ['p.stan_magazynowy >= 0'];

    if (search) {
      where.push('(p.nazwa LIKE ? OR pr.nazwa LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (kategoria_id) {
      // Obsługa podkategorii — pobierz produkt jeśli jego kategoria to dana lub jej dzieci
      where.push(`(p.kategoria_id = ? OR k.parent_id = ?)`);
      params.push(kategoria_id, kategoria_id);
    }
    if (producent_id) {
      where.push('p.producent_id = ?');
      params.push(producent_id);
    }
    if (cena_min) {
      where.push('p.cena_brutto >= ?');
      params.push(cena_min);
    }
    if (cena_max) {
      where.push('p.cena_brutto <= ?');
      params.push(cena_max);
    }
    if (tagi) {
      const tagList = tagi.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        const placeholders = tagList.map(() => '?').join(',');
        where.push(`EXISTS (
          SELECT 1 FROM produkty_tagi pt2
          JOIN tagi t2 ON t2.id = pt2.tag_id
          WHERE pt2.produkt_id = p.id AND t2.nazwa IN (${placeholders})
        )`);
        params.push(...tagList);
      }
    }

    const orderMap = {
      id_asc:     'p.id ASC',
      id_desc:    'p.id DESC',
      cena_asc:   'p.cena_brutto ASC',
      cena_desc:  'p.cena_brutto DESC',
      nazwa_asc:  'p.nazwa ASC',
      nazwa_desc: 'p.nazwa DESC',
    };
    const orderBy = orderMap[sort] || 'p.id ASC';

    const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countSQL = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM produkty p
      JOIN producenci pr ON pr.id = p.producent_id
      JOIN kategorie k ON k.id = p.kategoria_id
      ${whereSQL}
    `;
    const [[{ total }]] = await pool.query(countSQL, params);

    const dataSQL = `
      SELECT
        p.id, p.sku, p.nazwa, p.cena_brutto, p.stan_magazynowy, p.opis,
        pr.id AS producent_id, pr.nazwa AS producent,
        k.id AS kategoria_id, k.nazwa AS kategoria, k.parent_id AS kategoria_parent_id,
        GROUP_CONCAT(DISTINCT t.nazwa ORDER BY t.nazwa SEPARATOR ',') AS tagi
      FROM produkty p
      JOIN producenci pr ON pr.id = p.producent_id
      JOIN kategorie k ON k.id = p.kategoria_id
      LEFT JOIN produkty_tagi pt ON pt.produkt_id = p.id
      LEFT JOIN tagi t ON t.id = pt.tag_id
      ${whereSQL}
      GROUP BY p.id, p.sku, p.nazwa, p.cena_brutto, p.stan_magazynowy, p.opis,
               pr.id, pr.nazwa, k.id, k.nazwa, k.parent_id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataSQL, [...params, parseInt(limit), offset]);

    const produkty = rows.map(r => ({
      ...r,
      tagi: r.tagi ? r.tagi.split(',') : [],
    }));

    res.json({ total: parseInt(total), page: parseInt(page), limit: parseInt(limit), produkty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/produkty/:id — szczegóły produktu z cechami i dopasowaniami
router.get('/:id', async (req, res) => {
  try {
    const [[produkt]] = await pool.query(`
      SELECT
        p.id, p.sku, p.nazwa, p.cena_brutto, p.stan_magazynowy, p.opis,
        pr.id AS producent_id, pr.nazwa AS producent,
        k.id AS kategoria_id, k.nazwa AS kategoria
      FROM produkty p
      JOIN producenci pr ON pr.id = p.producent_id
      JOIN kategorie k ON k.id = p.kategoria_id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!produkt) return res.status(404).json({ error: 'Produkt nie znaleziony' });

    // Cechy/atrybuty
    const [cechy] = await pool.query(`
      SELECT a.nazwa AS atrybut, pc.wartosc
      FROM produkty_cechy pc
      JOIN atrybuty a ON a.id = pc.atrybut_id
      WHERE pc.produkt_id = ?
    `, [req.params.id]);

    // Tagi
    const [tagi] = await pool.query(`
      SELECT t.nazwa FROM produkty_tagi pt JOIN tagi t ON t.id = pt.tag_id WHERE pt.produkt_id = ?
    `, [req.params.id]);

    // Dopasowania (pojazdy)
    const [dopasowania] = await pool.query(`
      SELECT m.nazwa AS marka, mo.nazwa AS model, mo.lata_produkcji,
             ts.pojemnosc, ts.moc_km, ts.paliwo
      FROM dopasowania d
      JOIN typy_silnikowe ts ON ts.id = d.typ_id
      JOIN modele mo ON mo.id = ts.model_id
      JOIN marki m ON m.id = mo.marka_id
      WHERE d.produkt_id = ?
      ORDER BY m.nazwa, mo.nazwa
    `, [req.params.id]);

    // Opinie
    const [opinie] = await pool.query(`
      SELECT o.ocena, o.komentarz, o.data_dodania,
             u.email AS autor
      FROM opinie o
      JOIN uzytkownicy u ON u.id = o.uzytkownik_id
      WHERE o.produkt_id = ?
      ORDER BY o.data_dodania DESC
    `, [req.params.id]);

    res.json({
      ...produkt,
      cechy,
      tagi: tagi.map(t => t.nazwa),
      dopasowania,
      opinie,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
