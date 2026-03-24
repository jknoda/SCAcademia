import { randomUUID } from 'crypto';
import { pool } from './db';
import { storeAuthToken, getValidAuthToken, revokeAuthTokensByUser, getUserById } from './database';
import { getAcademyById } from './database';

export interface ConsentRecord {
  consentId: string;
  userId: string;
  academyId: string;
  consentTemplateVersion: number;
  consentType: 'health' | 'ethics' | 'privacy';
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'withdrawn';
  signatureImage: Buffer | null;
  signedByUserId: string | null;
  guardianId: string | null;
  createdAt: Date;
  signedAt: Date | null;
  expiresAt: Date | null;
}

export interface ConsentTemplate {
  templateId: string;
  academyId: string;
  version: number;
  consentType: 'health' | 'ethics' | 'privacy';
  content: string;
  isActive: boolean;
  effectiveAt: Date | null;
}

export interface ConsentTokenValidation {
  studentId: string;
  academyId: string;
  studentName: string;
  academyName: string;
  expiresAt: Date;
  isReconsent?: boolean;
  previousVersion?: number;
  newVersion?: number;
}

type PublishConsentTemplatesInput = {
  healthContent: string;
  ethicsContent: string;
  privacyContent: string;
  bumpType?: 'minor' | 'major';
};

export type ReconsentRequest = {
  studentId: string;
  studentName: string;
  previousVersion: number;
  newVersion: number;
  consentLink: string;
  guardianEmail?: string;
};

const rowToConsent = (row: any): ConsentRecord => ({
  consentId: row.consent_id,
  userId: row.user_id,
  academyId: row.academy_id,
  consentTemplateVersion: Number(row.consent_template_version),
  consentType: row.consent_type,
  status: row.status,
  signatureImage: row.signature_image || null,
  signedByUserId: row.signed_by_user_id || null,
  guardianId: row.guardian_id || null,
  createdAt: row.created_at,
  signedAt: row.signed_at || null,
  expiresAt: row.expires_at || null,
});

const rowToTemplate = (row: any): ConsentTemplate => ({
  templateId: row.template_id,
  academyId: row.academy_id,
  version: Number(row.version),
  consentType: row.consent_type,
  content: row.content,
  isActive: row.is_active,
  effectiveAt: row.effective_at || null,
});

let ensuredVersionSchema = false;

const ensureConsentVersionSchema = async (): Promise<void> => {
  if (ensuredVersionSchema) {
    return;
  }

  await pool.query(`
    ALTER TABLE consent_templates
    ALTER COLUMN version TYPE numeric(3,1)
    USING version::numeric(3,1)
  `).catch(() => undefined);

  await pool.query(`
    ALTER TABLE consents
    ALTER COLUMN consent_template_version TYPE numeric(3,1)
    USING consent_template_version::numeric(3,1)
  `).catch(() => undefined);

  ensuredVersionSchema = true;
};

const getNextVersion = (currentVersion: number | null, bumpType: 'minor' | 'major' = 'minor'): number => {
  if (!currentVersion) {
    return 1.0;
  }

  if (bumpType === 'major') {
    return Math.floor(currentVersion) + 1.0;
  }

  return Number((currentVersion + 0.1).toFixed(1));
};

const normalizeTemplateContent = (content: string): string => content.trim();

// Generate a consent request token (valid 7 days) and store in auth_tokens
export const createConsentRequest = async (
  studentId: string,
  academyId: string
): Promise<string> => {
  // Revoke any previous consent_request tokens for this student
  await revokeAuthTokensByUser(studentId, 'consent_request');

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await storeAuthToken(studentId, academyId, 'consent_request', token, expiresAt);
  return token;
};

// Validate token and return student/academy info for wizard display
export const validateConsentToken = async (
  token: string
): Promise<ConsentTokenValidation | null> => {
  const record = await getValidAuthToken('consent_request', token);
  if (!record) return null;

  const [student, academy] = await Promise.all([
    getUserById(record.userId),
    getAcademyById(record.academyId),
  ]);

  if (!student || !academy) return null;

  // Check if this is a re-consent by looking for previously accepted consents
  const previousConsent = await pool.query(
    `SELECT DISTINCT consent_template_version FROM consents
     WHERE user_id = $1 AND status = 'accepted'
     LIMIT 1`,
    [record.userId]
  );

  // Get the new/current version for all active templates
  const newTemplateVersion = await pool.query(
    `SELECT DISTINCT version FROM consent_templates
     WHERE academy_id = $1 AND is_active = true
     LIMIT 1`,
    [record.academyId]
  );

  const isReconsent = previousConsent.rows.length > 0;
  const previousVersion = isReconsent ? Number(previousConsent.rows[0].consent_template_version) : undefined;
  const newVersion = newTemplateVersion.rows.length > 0 ? Number(newTemplateVersion.rows[0].version) : undefined;

  return {
    studentId: record.userId,
    academyId: record.academyId,
    studentName: student.fullName,
    academyName: academy.name,
    expiresAt: record.expiresAt,
    isReconsent,
    previousVersion,
    newVersion,
  };
};

// Get the active consent template for a given type and academy
export const getActiveTemplate = async (
  academyId: string,
  consentType: 'health' | 'ethics' | 'privacy'
): Promise<ConsentTemplate | null> => {
  await ensureConsentVersionSchema();
  const res = await pool.query(
    `SELECT * FROM consent_templates
     WHERE academy_id = $1 AND consent_type = $2 AND is_active = true
     ORDER BY version DESC LIMIT 1`,
    [academyId, consentType]
  );
  return res.rows.length ? rowToTemplate(res.rows[0]) : null;
};

export const ensureActiveTemplateByType = async (
  academyId: string,
  consentType: 'health' | 'ethics' | 'privacy'
): Promise<ConsentTemplate | null> => {
  const active = await getActiveTemplate(academyId, consentType);
  if (active) {
    return active;
  }

  // If templates exist but are all inactive, reactivate the most recent one.
  const reactivated = await pool.query(
    `UPDATE consent_templates
     SET is_active = true,
         effective_at = COALESCE(effective_at, NOW()),
         expires_at = NULL
     WHERE template_id = (
       SELECT template_id
       FROM consent_templates
       WHERE academy_id = $1
         AND consent_type = $2
       ORDER BY version DESC, created_at DESC
       LIMIT 1
     )
     RETURNING *`,
    [academyId, consentType]
  );

  if (reactivated.rows.length > 0) {
    return rowToTemplate(reactivated.rows[0]);
  }

  // No template rows exist for this type yet: seed defaults and try again.
  await seedDefaultTemplates(academyId);
  return getActiveTemplate(academyId, consentType);
};

// Get a specific version of a consent template (for re-consent comparison)
export const getTemplateByVersion = async (
  academyId: string,
  consentType: 'health' | 'ethics' | 'privacy',
  version: number
): Promise<ConsentTemplate | null> => {
  await ensureConsentVersionSchema();
  const res = await pool.query(
    `SELECT * FROM consent_templates
     WHERE academy_id = $1 AND consent_type = $2 AND version = $3
     LIMIT 1`,
    [academyId, consentType, version]
  );
  return res.rows.length ? rowToTemplate(res.rows[0]) : null;
};

export const getActiveTemplatesByAcademy = async (academyId: string): Promise<ConsentTemplate[]> => {
  await ensureConsentVersionSchema();
  const res = await pool.query(
    `SELECT DISTINCT ON (consent_type) *
     FROM consent_templates
     WHERE academy_id = $1 AND is_active = true
     ORDER BY consent_type, version DESC`,
    [academyId]
  );

  return res.rows.map(rowToTemplate);
};

export const publishConsentTemplateVersion = async (
  academyId: string,
  input: PublishConsentTemplatesInput
): Promise<{ version: number; templates: ConsentTemplate[]; affectedStudents: ReconsentRequest[] }> => {
  await ensureConsentVersionSchema();

  const bumpType = input.bumpType ?? 'minor';
  const contents = {
    health: normalizeTemplateContent(input.healthContent),
    ethics: normalizeTemplateContent(input.ethicsContent),
    privacy: normalizeTemplateContent(input.privacyContent),
  };

  await pool.query('BEGIN');
  try {
    const currentVersionRes = await pool.query(
      `SELECT MAX(version) AS current_version
       FROM consent_templates
       WHERE academy_id = $1`,
      [academyId]
    );

    const currentVersion = currentVersionRes.rows[0]?.current_version
      ? Number(currentVersionRes.rows[0].current_version)
      : null;
    const nextVersion = getNextVersion(currentVersion, bumpType);

    await pool.query(
      `UPDATE consent_templates
       SET is_active = false,
           expires_at = COALESCE(expires_at, NOW())
       WHERE academy_id = $1 AND is_active = true`,
      [academyId]
    );

    const types: Array<'health' | 'ethics' | 'privacy'> = ['health', 'ethics', 'privacy'];
    for (const type of types) {
      await pool.query(
        `INSERT INTO consent_templates
           (template_id, academy_id, version, consent_type, content, is_active, effective_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NULL)`,
        [randomUUID(), academyId, nextVersion, type, contents[type]]
      );
    }

    await pool.query('COMMIT');

    const reconsentCandidatesRes = await pool.query(
      `SELECT
         u.user_id,
         u.full_name,
         MAX(c.consent_template_version) AS previous_version,
         COUNT(DISTINCT c.consent_type) AS accepted_count
       FROM users u
       JOIN consents c
         ON c.user_id = u.user_id
        AND c.status = 'accepted'
       WHERE u.academy_id = $1
         AND u.is_minor = true
         AND u.minor_consent_signed = true
         AND u.deleted_at IS NULL
       GROUP BY u.user_id, u.full_name
       HAVING COUNT(DISTINCT c.consent_type) = 3
          AND MAX(c.consent_template_version) < $2
       ORDER BY u.full_name`,
      [academyId, nextVersion]
    );

    const affectedStudents: ReconsentRequest[] = [];
    for (const row of reconsentCandidatesRes.rows) {
      const token = await createConsentRequest(row.user_id, academyId);
      // TODO: Fetch guardian email from users table when responsavel_email column is added
      affectedStudents.push({
        studentId: row.user_id,
        studentName: row.full_name,
        previousVersion: Number(row.previous_version),
        newVersion: nextVersion,
        consentLink: `http://localhost:4200/consent/${token}`,
        guardianEmail: undefined, // Email sending will be implemented when customer email system is ready
      });
    }

    const templates = await getActiveTemplatesByAcademy(academyId);
    return { version: nextVersion, templates, affectedStudents };
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

// Sign consent: insert 3 records (privacy, health, ethics) and mark student consent signed
export const signConsents = async (
  token: string,
  signatureBase64: string,
  guardianId: string | null
): Promise<{ studentName: string }> => {
  const record = await getValidAuthToken('consent_request', token);
  if (!record) throw new Error('TOKEN_INVALID');

  const student = await getUserById(record.userId);
  if (!student) throw new Error('STUDENT_NOT_FOUND');

  // Convert base64 PNG to Buffer for BYTEA storage
  const base64Data = signatureBase64.includes(',')
    ? signatureBase64.split(',')[1]
    : signatureBase64;
  const signatureBuffer = Buffer.from(base64Data, 'base64');

  const consentTypes: Array<'privacy' | 'health' | 'ethics'> = ['privacy', 'health', 'ethics'];

  await pool.query('BEGIN');
  try {
    for (const consentType of consentTypes) {
      const template = await getActiveTemplate(record.academyId, consentType);
      const templateVersion = template?.version ?? 1;

      await pool.query(
        `INSERT INTO consents
           (consent_id, user_id, academy_id, consent_template_version, consent_type,
            status, signature_image, signed_by_user_id, guardian_id, signed_at)
         VALUES ($1, $2, $3, $4, $5, 'accepted', $6, NULL, $7, NOW())`,
        [
          randomUUID(),
          record.userId,
          record.academyId,
          templateVersion,
          consentType,
          signatureBuffer,
          guardianId,
        ]
      );
    }

    // Mark the student's consent as signed
    await pool.query(
      `UPDATE users SET minor_consent_signed = true, updated_at = NOW() WHERE user_id = $1`,
      [record.userId]
    );

    // Revoke the token so it cannot be reused
    await revokeAuthTokensByUser(record.userId, 'consent_request');

    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }

  return { studentName: student.fullName };
};

// Get consent status for a student
export const getConsentStatus = async (
  studentId: string
): Promise<'accepted' | 'pending' | 'expired' | 'none'> => {
  // Check if all 3 consent types are accepted
  const res = await pool.query(
    `SELECT COUNT(*) AS cnt FROM consents
     WHERE user_id = $1 AND status = 'accepted'`,
    [studentId]
  );
  const count = parseInt(res.rows[0].cnt, 10);
  if (count >= 3) return 'accepted';

  // Check for active pending token
  const tokenRes = await pool.query(
    `SELECT * FROM auth_tokens
     WHERE user_id = $1 AND token_type = 'consent_request'
       AND revoked_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [studentId]
  );
  if (tokenRes.rows.length) return 'pending';

  // Check for expired token (never signed)
  const expiredRes = await pool.query(
    `SELECT * FROM auth_tokens
     WHERE user_id = $1 AND token_type = 'consent_request'
       AND expires_at <= NOW()
     LIMIT 1`,
    [studentId]
  );
  if (expiredRes.rows.length) return 'expired';

  return 'none';
};

// Ensure default consent templates exist (called at startup / seed)
export const seedDefaultTemplates = async (academyId: string): Promise<void> => {
  await ensureConsentVersionSchema();
  const templates: Array<{ type: 'privacy' | 'health' | 'ethics'; content: string }> = [
    {
      type: 'privacy',
      content:
        'TERMO DE CONSENTIMENTO PARA COLETA E TRATAMENTO DE DADOS PESSOAIS DE MENOR DE IDADE\n\n' +
        'Conforme a Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018), ' +
        'este termo autoriza a academia a coletar, armazenar e processar os dados pessoais e de saúde ' +
        'do menor de idade sob sua responsabilidade, exclusivamente para fins de gestão esportiva, ' +
        'acompanhamento de desempenho e cuidados de saúde no ambiente da academia. ' +
        'Os dados serão tratados com sigilo e segurança, sendo armazenados de forma criptografada. ' +
        'O titular (ou seu responsável legal) poderá solicitar a exclusão dos dados a qualquer momento. ' +
        'Este consentimento é válido por 12 meses, podendo ser renovado.',
    },
    {
      type: 'health',
      content:
        'AUTORIZAÇÃO PARA USO DE IMAGEM E SOM\n\n' +
        'Autorizo a academia a capturar, utilizar e divulgar imagens e gravações de áudio/vídeo ' +
        'do menor de idade sob minha responsabilidade, para fins exclusivos de registro de atividades ' +
        'esportivas, material educativo interno e comunicação interna da academia. ' +
        'As imagens não serão comercializadas nem divulgadas em meios externos sem novo consentimento.',
    },
    {
      type: 'ethics',
      content:
        'CÓDIGO DE ÉTICA E CONDUTA\n\n' +
        'Declaro que li e aceito o Código de Ética da Academia, comprometendo-me a:\n' +
        '1. Respeitar professores, funcionários e colegas;\n' +
        '2. Manter postura de respeito e fair play nas práticas esportivas;\n' +
        '3. Zelar pelo patrimônio e equipamentos da academia;\n' +
        '4. Comunicar qualquer situação de risco ou irregularidade à administração;\n' +
        '5. Cumprir o regulamento interno da academia.',
    },
  ];

  for (const tpl of templates) {
    await pool.query(
      `INSERT INTO consent_templates
         (template_id, academy_id, version, consent_type, content, is_active, effective_at)
       VALUES ($1, $2, 1, $3, $4, true, NOW())
       ON CONFLICT (academy_id, consent_type, version) DO NOTHING`,
      [randomUUID(), academyId, tpl.type, tpl.content]
    );
  }
};
