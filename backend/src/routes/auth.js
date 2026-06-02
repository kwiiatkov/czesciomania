import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, rola: user.rola },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, haslo } = req.body;
    if (!email || !haslo) {
      return res.status(400).json({ error: 'Podaj email i hasło' });
    }

    const [[user]] = await pool.query(
      'SELECT id, email, haslo, rola FROM uzytkownicy WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (!user) return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });

    const ok = await bcrypt.compare(haslo, user.haslo);
    if (!ok) return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, rola: user.rola },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, haslo, imie_nazwisko } = req.body;
    if (!email || !haslo) {
      return res.status(400).json({ error: 'Podaj email i hasło' });
    }
    if (haslo.length < 6) {
      return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
    }

    const [[existing]] = await pool.query(
      'SELECT id FROM uzytkownicy WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if (existing) {
      return res.status(409).json({ error: 'Konto z tym adresem email już istnieje' });
    }

    const hash = await bcrypt.hash(haslo, 12);
    const [result] = await pool.query(
      'INSERT INTO uzytkownicy (email, haslo, rola) VALUES (?, ?, ?)',
      [email.toLowerCase().trim(), hash, 'klient']
    );

    const user = { id: result.insertId, email: email.toLowerCase().trim(), rola: 'klient' };
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/auth/me — dane zalogowanego użytkownika
router.get('/me', authRequired, async (req, res) => {
  try {
    const [[user]] = await pool.query(
      'SELECT id, email, rola, data_rejestracji FROM uzytkownicy WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
