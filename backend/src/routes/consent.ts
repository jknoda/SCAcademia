import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { consentSignSchema } from '../lib/validators';
import {
  validateTokenHandler,
  getTemplateHandler,
  getTemplateByVersionHandler,
  signConsentHandler,
  resendConsentHandler,
  getConsentStatusHandler,
} from '../controllers/consent';

const router = Router();

// ── Rotas públicas (guest flow — sem autenticação) ──────────────────────────
router.get('/:token/validate', validateTokenHandler);
router.get('/:token/template/:type', getTemplateHandler);
router.get('/:token/template/:type/version/:version', getTemplateByVersionHandler);
router.post('/:token/sign', validate(consentSignSchema), signConsentHandler);

// ── Rotas Admin ─────────────────────────────────────────────────────────────
router.post('/admin/students/:studentId/resend', authMiddleware, resendConsentHandler);
router.get('/admin/students/:studentId/status', authMiddleware, getConsentStatusHandler);

export default router;
