import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

// GET /api/kategorie — drzewo kategorii (parent + children)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, parent_id, nazwa FROM kategorie ORDER BY parent_id IS NOT NULL, parent_id, id'
    );

    // Buduj drzewo
    const topLevel = rows.filter(r => r.parent_id === null);
    const children = rows.filter(r => r.parent_id !== null);

    const tree = topLevel.map(cat => ({
      ...cat,
      children: children.filter(c => c.parent_id === cat.id),
    }));

    res.json(tree);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
