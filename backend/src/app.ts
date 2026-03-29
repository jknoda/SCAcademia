import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import {
  createAcademyTechniqueHandler,
  deleteAcademyTechniqueHandler,
  getAcademyTechniquesHandler,
} from './controllers/trainingTechniques';
import usersRoutes from './routes/users';
import adminRoutes from './routes/admin';
import healthScreeningRoutes from './routes/healthScreening';
import consentRoutes from './routes/consent';
import trainingsRoutes from './routes/trainings';
import { authMiddleware, requireRole } from './middleware/auth';

dotenv.config();

const app: Express = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4200',
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'http://[::1]:4200',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(origin);
    if (isLocalhost || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(cookieParser());

app.get('/health', (_req, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/health/email', async (_req, res: Response) => {
  try {
    const nodemailer = require('nodemailer');
    
    const smtpService = process.env.SMTP_SERVICE?.trim().toLowerCase();
    const hasConfig = process.env.SMTP_USER && process.env.SMTP_PASS && (smtpService || (process.env.SMTP_HOST && process.env.SMTP_PORT));
    
    if (!hasConfig) {
      return res.json({ 
        status: 'SMTP_NOT_CONFIGURED',
        message: 'Email será simulado (console.log)',
        env: {
          SMTP_SERVICE: process.env.SMTP_SERVICE || 'not set',
          SMTP_USER: process.env.SMTP_USER ? '***' : 'not set',
          SMTP_HOST: process.env.SMTP_HOST || 'not set',
        }
      });
    }

    let transporter: any;
    if (smtpService) {
      transporter = nodemailer.createTransport({
        service: smtpService,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });
    }

    const verification = await transporter.verify();
    
    res.json({
      status: verification ? 'OK' : 'FAILED',
      message: verification ? 'SMTP connection successful' : 'SMTP connection failed',
      config: {
        service: smtpService || 'custom',
        user: process.env.SMTP_USER || 'not set',
        fromEmail: process.env.SMTP_FROM_EMAIL || 'not set',
        fromName: process.env.SMTP_FROM_NAME || 'SCAcademia',
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      code: error.code,
      command: error.command,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }), usersRoutes);
app.use('/api/admin', rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }), adminRoutes);
app.use('/api/health-screening', rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }), healthScreeningRoutes);
app.use('/api/consent', rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false }), consentRoutes);
app.get(
  '/api/academies/:academyId/techniques',
  rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }),
  authMiddleware,
  requireRole(['Professor']),
  getAcademyTechniquesHandler
);
app.post(
  '/api/academies/:academyId/techniques',
  rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }),
  authMiddleware,
  requireRole(['Professor']),
  createAcademyTechniqueHandler
);
app.delete(
  '/api/academies/:academyId/techniques/:techniqueId',
  rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }),
  authMiddleware,
  requireRole(['Professor']),
  deleteAcademyTechniqueHandler
);
app.use('/api/trainings', rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }), trainingsRoutes);

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
