import { Router } from 'express';
import * as authController from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  academyFormSchema,
  adminRegistrationSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  userRegistrationSchema,
} from '../lib/validators';
import { resetDatabase } from '../lib/database';

const router = Router();

const isTest = process.env['NODE_ENV'] === 'test';

// Test-only reset endpoint (disabled in production)
if (isTest || process.env['NODE_ENV'] === 'development') {
  router.post('/test/reset', async (_req, res) => {
    try {
      await resetDatabase();
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });
}

// Public routes
router.get('/setup/init', authController.checkSetupNeeded);
router.post('/academies', validate(academyFormSchema), authController.createAcademyHandler);
router.post('/academies/:academyId/init-admin', validate(adminRegistrationSchema), authController.initAdminHandler);
router.post('/register', validate(userRegistrationSchema), authController.registerUserHandler);
router.post('/login', validate(loginSchema), authController.loginHandler);
router.post('/refresh', authController.refreshTokenHandler);
router.post('/logout', authController.logoutHandler);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPasswordHandler);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPasswordHandler);

// Protected routes
router.get('/users/@me', authMiddleware, authController.getCurrentUserHandler);

export default router;
