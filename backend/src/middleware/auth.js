import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Brak tokenu autoryzacji' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Nieprawidłowy lub wygasły token' });
  }
}

export function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.rola !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień administratora' });
    }
    next();
  });
}
