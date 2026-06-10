import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
 
import authRoutes      from './routes/auth.js';
import produktyRoutes  from './routes/produkty.js';
import kategorieRoutes from './routes/kategorie.js';
import koszykRoutes    from './routes/koszyk.js';
import zamowieniaRoutes from './routes/zamowienia.js';
import kontoRoutes     from './routes/konto.js';
import adminRoutes     from './routes/admin.js';
 
dotenv.config();
 
const app = express();
const PORT = process.env.PORT || 3001;
 
// ─── Middleware ────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
 
// Logowanie requestów (dev)
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});
 
// ─── Routes ────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/produkty',   produktyRoutes);
app.use('/api/kategorie',  kategorieRoutes);
app.use('/api/koszyk',     koszykRoutes);
app.use('/api/zamowienia', zamowieniaRoutes);
app.use('/api/konto',      kontoRoutes);
app.use('/api/admin',      adminRoutes);
 
// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));
 
// 404
app.use((_req, res) => res.status(404).json({ error: 'Endpoint nie istnieje' }));
 
// ─── Start ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend API działa na http://localhost:${PORT}`);
});
 