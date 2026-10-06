import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in first' });
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: p.id, role: p.role };
    next();
  } catch {
    res.status(401).json({ message: 'Session expired. Please log in again' });
  }
};

export const adminOnly = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only' });
