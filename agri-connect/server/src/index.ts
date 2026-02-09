import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import listingsRoutes from './routes/listings';
import accountRoutes from './routes/account';
import messagesRoutes from './routes/messages';
import usersRoutes from './routes/users';
import assistantRoutes from './routes/assistant';
import qualityRoutes from './routes/quality';
import http from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from './models/Message';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

app.get('/', (req: Request, res: Response) => res.json({ status: 'ok' }));
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/account', accountRoutes);
app.use('/messages', messagesRoutes);
app.use('/users', usersRoutes);
app.use('/', listingsRoutes);
app.use('/assistant', assistantRoutes);
app.use('/', qualityRoutes);

async function start() {
  await mongoose.connect(config.mongoUri);
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  // expose io to routes
  app.set('io', io);
  // presence map: userId -> connection count
  const presence = new Map<string, number>();
  app.set('presence', presence);

  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = (socket.handshake.auth as any)?.token as string | undefined;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = jwt.verify(token, config.jwtSecret) as any;
      (socket as any).user = { id: payload.id, role: payload.role };
      socket.join(payload.id);
      console.log('[socket] auth ok, joined room', payload.id);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const u = (socket as any).user as { id: string, role: string } | undefined;
    console.log('[socket] connected', u?.id, u?.role);
    if (u?.id) {
      const c = presence.get(u.id) || 0; presence.set(u.id, c + 1);
    }
    socket.on('message:send', async (payload: { to: string; body: string }) => {
      const user = (socket as any).user as { id: string };
      if (!user || !payload?.to || !payload?.body) return;
      console.log('[socket] message:send', { from: user.id, to: payload.to, len: payload.body.length });
      if (user.id === payload.to) {
        console.warn('!!! [socket] WARNING: Sender is sending message to THEMSELVES (from === to). This explains single-sided chat.');
      }
      const msg = await Message.create({ from: user.id, to: payload.to, body: payload.body });
      io.to(payload.to).emit('message:new', msg);
      io.to(user.id).emit('message:new', msg);
      console.log('[socket] message:delivered to rooms', payload.to, 'and', user.id);
    });

    socket.on('disconnect', () => {
      const uu = (socket as any).user as { id: string } | undefined;
      if (uu?.id) {
        const c = presence.get(uu.id) || 0;
        if (c <= 1) presence.delete(uu.id); else presence.set(uu.id, c - 1);
      }
    });
  });

  server.listen(config.port, () => console.log(`server:${config.port}`));
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
