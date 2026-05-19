import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import User from '../models/User'

const router = Router()

// GET /users/:id - minimal public info (name)
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const u = await User.findById(req.params.id).select('name role')
  if (!u) return res.status(404).json({ message: 'Not found' })
  const presence = req.app.get('presence') as Map<string, number> | undefined
  const online = presence ? (presence.get(String(u._id)) || 0) > 0 : false
  res.json({ _id: u._id, name: u.name, role: (u as any).role, online })
})

export default router
