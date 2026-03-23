import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import adminRoutes from './routes/admin';

dotenv.config();

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  })
);
app.use(cookieParser());

app.get('/health', (_req, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }), usersRoutes);
app.use('/api/admin', rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }), adminRoutes);

app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  // Defensive guard: in edge cases where this middleware is invoked with a
  // non-Response argument in the third position, delegate to next(error)
  // instead of throwing "res.status is not a function".
  if (!res || typeof (res as any).status !== 'function') {
    const delegate = typeof (res as any) === 'function' ? (res as any) : next;
    if (typeof delegate === 'function') {
      return delegate(err);
    }
    return;
  }

  console.error('Error:', err);
  return res.status(err?.status || 500).json({
    error: err?.message || 'Erro interno do servidor',
  });
});

export default app;
