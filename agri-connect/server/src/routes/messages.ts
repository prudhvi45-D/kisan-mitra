import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import Message from '../models/Message'
import multer from 'multer'
import path from 'path'

const router = Router()
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.jpg'
    const name = `${Date.now()}-${Math.round(Math.random()*1e6)}${ext}`
    cb(null, name)
  }
})
const upload = multer({ storage })

// GET /messages/:peer - conversation history with a peer user
router.get('/:peer', authenticate, async (req: Request & { user?: { id: string } }, res: Response) => {
  const me = req.user!.id
  const peer = req.params.peer
  const msgs = await Message.find({
    $or: [ { from: me, to: peer }, { from: peer, to: me } ]
  }).sort({ createdAt: 1 })
  res.json(msgs)
})

// DELETE /messages/:peer - clear entire conversation with a peer
router.delete('/:peer', authenticate, async (req: Request & { user?: { id: string } }, res: Response) => {
  const me = req.user!.id
  const peer = req.params.peer
  const result = await Message.deleteMany({
    $or: [ { from: me, to: peer }, { from: peer, to: me } ]
  })
  res.json({ deleted: (result as any).deletedCount ?? 0 })
})

// POST /messages/:peer/image - send an image message
router.post('/:peer/image', authenticate, upload.single('image'), async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const me = req.user!.id
    const peer = req.params.peer
    const file = (req as any).file as Express.Multer.File | undefined
    if (!file) return res.status(400).json({ message: 'No image' })
    const image = '/' + file.path.replace(/\\/g, '/')
    const msg = await Message.create({ from: me, to: peer, image })
    // broadcast to both users
    const io = req.app.get('io')
    if (io) {
      io.to(peer).emit('message:new', msg)
      io.to(me).emit('message:new', msg)
    }
    res.json(msg)
  } catch (e) {
    res.status(500).json({ message: 'Error' })
  }
})

export default router
