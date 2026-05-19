import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /account/me - current user profile
router.get('/me', authenticate, async (req: Request & { user?: { id: string } }, res: Response) => {
  const id = req.user!.id;
  const user = await User.findById(id).select('-password');
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user);
});

// PUT /account/me - update profile
router.put(
  '/me',
  authenticate,
  body('name').optional().isString().notEmpty(),
  body('locale').optional().isString(),
  body('phone').optional().isString(),
  body('location').optional().isString(),
  async (req: Request & { user?: { id: string } }, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = req.user!.id;
    const updates: any = {};
    const allowed = ['name', 'locale', 'phone', 'location'];
    for (const k of allowed) if (k in req.body) updates[k] = (req.body as any)[k];

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  }
);

// POST /account/change-password
router.post(
  '/change-password',
  authenticate,
  body('currentPassword').isString().isLength({ min: 6 }),
  body('newPassword').isString().isLength({ min: 6 }),
  async (req: Request & { user?: { id: string } }, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body as any;
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ message: 'Not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password updated' });
  }
);

export default router;
