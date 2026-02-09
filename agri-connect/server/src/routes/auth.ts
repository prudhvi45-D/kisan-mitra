import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { config } from '../config';

const router = Router();

router.post('/register',
  body('name').isString().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'farmer', 'buyer']),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role });
    res.json({ id: user.id });
  }
);

router.post('/login',
  body('email').isEmail(),
  body('password').isString(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const access = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '1h' });
    const refresh = jwt.sign({ id: user.id, role: user.role }, config.jwtRefreshSecret, { expiresIn: '7d' });
    res.json({ access, refresh, role: user.role });
  }
);

router.post('/refresh', async (req: Request, res: Response) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, config.jwtRefreshSecret) as { id: string; role: string };
    const access = jwt.sign({ id: payload.id, role: payload.role }, config.jwtSecret, { expiresIn: '1h' });
    res.json({ access });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

export default router;
