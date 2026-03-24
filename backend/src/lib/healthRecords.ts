import { randomUUID } from 'crypto';
import { pool } from './db';
import { encryptOrNull, decryptOrNull } from './encryption';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface HealthRecord {
  healthRecordId: string;
  userId: string;
  academyId: string;
  bloodType: string | null;
  weightKg: number | null;
  heightCm: number | null;
  hypertension: boolean;
  diabetes: boolean;
  cardiac: boolean;
  labyrinthitis: boolean;
  asthmaBronchitis: boolean;
  epilepsySeizures: boolean;
  stressDepression: boolean;
  healthScreeningNotes: string | null;
  allergies: string | null;
  medications: string | null;
  existingConditions: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHealthRecordInput {
  userId: string;
  academyId: string;
  bloodType?: string;
  weightKg?: number;
  heightCm?: number;
  hypertension?: boolean;
  diabetes?: boolean;
  cardiac?: boolean;
  labyrinthitis?: boolean;
  asthmaBronchitis?: boolean;
  epilepsySeizures?: boolean;
  stressDepression?: boolean;
  healthScreeningNotes?: string;
  allergies?: string;
  medications?: string;
  existingConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdByUserId: string;
}

export type UpdateHealthRecordInput = Partial<
  Omit<CreateHealthRecordInput, 'userId' | 'academyId' | 'createdByUserId'>
>;

// ── Row mapper (DB → domain) ───────────────────────────────────────────────────
// Emergency contact is stored as JSON inside one encrypted BYTEA field.
// Layout: { name: string; phone: string }

const decryptEmergencyContact = (
  data: Buffer | null | undefined
): { name: string | null; phone: string | null } => {
  const raw = decryptOrNull(data);
  if (!raw) return { name: null, phone: null };
  try {
    const parsed = JSON.parse(raw);
    return { name: parsed.name ?? null, phone: parsed.phone ?? null };
  } catch {
    return { name: raw, phone: null };
  }
};

const rowToHealthRecord = (row: any): HealthRecord => {
  const contact = decryptEmergencyContact(row.emergency_contact_encrypted);
  return {
    healthRecordId: row.health_record_id,
    userId: row.user_id,
    academyId: row.academy_id,
    bloodType: row.blood_type ?? null,
    weightKg: row.weight_kg ?? null,
    heightCm: row.height_cm ?? null,
    hypertension: row.hypertension ?? false,
    diabetes: row.diabetes ?? false,
    cardiac: row.cardiac ?? false,
    labyrinthitis: row.labyrinthitis ?? false,
    asthmaBronchitis: row.asthma_bronchitis ?? false,
    epilepsySeizures: row.epilepsy_seizures ?? false,
    stressDepression: row.stress_depression ?? false,
    healthScreeningNotes: row.health_screening_notes ?? null,
    allergies: decryptOrNull(row.allergies_encrypted),
    medications: decryptOrNull(row.medications_encrypted),
    existingConditions: decryptOrNull(row.existing_conditions_encrypted),
    emergencyContactName: contact.name,
    emergencyContactPhone: contact.phone,
    createdByUserId: row.created_by_user_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// ── Queries ────────────────────────────────────────────────────────────────────

export const createHealthRecord = async (
  input: CreateHealthRecordInput
): Promise<HealthRecord> => {
  const emergencyContact =
    input.emergencyContactName || input.emergencyContactPhone
      ? JSON.stringify({
          name: input.emergencyContactName ?? '',
          phone: input.emergencyContactPhone ?? '',
        })
      : null;

  const res = await pool.query(
    `INSERT INTO health_records (
       health_record_id, user_id, academy_id,
       blood_type, weight_kg, height_cm,
       hypertension, diabetes, cardiac, labyrinthitis,
       asthma_bronchitis, epilepsy_seizures, stress_depression,
       health_screening_notes,
       allergies_encrypted, medications_encrypted,
       existing_conditions_encrypted, emergency_contact_encrypted,
       created_by_user_id, created_at, updated_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW(),NOW()
     ) RETURNING *`,
    [
      randomUUID(),
      input.userId,
      input.academyId,
      input.bloodType ?? null,
      input.weightKg ?? null,
      input.heightCm ?? null,
      input.hypertension ?? false,
      input.diabetes ?? false,
      input.cardiac ?? false,
      input.labyrinthitis ?? false,
      input.asthmaBronchitis ?? false,
      input.epilepsySeizures ?? false,
      input.stressDepression ?? false,
      input.healthScreeningNotes ?? null,
      encryptOrNull(input.allergies),
      encryptOrNull(input.medications),
      encryptOrNull(input.existingConditions),
      encryptOrNull(emergencyContact),
      input.createdByUserId,
    ]
  );
  return rowToHealthRecord(res.rows[0]);
};

export const getHealthRecordByStudent = async (
  userId: string
): Promise<HealthRecord | undefined> => {
  const res = await pool.query(
    'SELECT * FROM health_records WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  return res.rows.length ? rowToHealthRecord(res.rows[0]) : undefined;
};

export const updateHealthRecord = async (
  healthRecordId: string,
  input: UpdateHealthRecordInput
): Promise<HealthRecord | undefined> => {
  const setClauses: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const setScalar = (col: string, val: any) => {
    setClauses.push(`${col} = $${idx++}`);
    values.push(val);
  };
  const setEncrypted = (col: string, val: string | undefined) => {
    setClauses.push(`${col} = $${idx++}`);
    values.push(encryptOrNull(val));
  };

  if (input.bloodType !== undefined) setScalar('blood_type', input.bloodType);
  if (input.weightKg !== undefined) setScalar('weight_kg', input.weightKg);
  if (input.heightCm !== undefined) setScalar('height_cm', input.heightCm);
  if (input.hypertension !== undefined) setScalar('hypertension', input.hypertension);
  if (input.diabetes !== undefined) setScalar('diabetes', input.diabetes);
  if (input.cardiac !== undefined) setScalar('cardiac', input.cardiac);
  if (input.labyrinthitis !== undefined) setScalar('labyrinthitis', input.labyrinthitis);
  if (input.asthmaBronchitis !== undefined) setScalar('asthma_bronchitis', input.asthmaBronchitis);
  if (input.epilepsySeizures !== undefined) setScalar('epilepsy_seizures', input.epilepsySeizures);
  if (input.stressDepression !== undefined) setScalar('stress_depression', input.stressDepression);
  if (input.healthScreeningNotes !== undefined) setScalar('health_screening_notes', input.healthScreeningNotes);
  if (input.allergies !== undefined) setEncrypted('allergies_encrypted', input.allergies);
  if (input.medications !== undefined) setEncrypted('medications_encrypted', input.medications);
  if (input.existingConditions !== undefined) setEncrypted('existing_conditions_encrypted', input.existingConditions);

  if (input.emergencyContactName !== undefined || input.emergencyContactPhone !== undefined) {
    // Re-fetch current record to merge partial emergency contact updates
    const current = await pool.query(
      'SELECT emergency_contact_encrypted FROM health_records WHERE health_record_id = $1',
      [healthRecordId]
    );
    if (current.rows.length) {
      const existing = (() => {
        const raw = decryptOrNull(current.rows[0].emergency_contact_encrypted);
        if (!raw) return { name: '', phone: '' };
        try { return JSON.parse(raw); } catch { return { name: raw, phone: '' }; }
      })();
      const merged = JSON.stringify({
        name: input.emergencyContactName ?? existing.name,
        phone: input.emergencyContactPhone ?? existing.phone,
      });
      setEncrypted('emergency_contact_encrypted', merged);
    }
  }

  if (setClauses.length === 0) return getHealthRecordByStudent('');

  setClauses.push('updated_at = NOW()');
  values.push(healthRecordId);

  const res = await pool.query(
    `UPDATE health_records SET ${setClauses.join(', ')} WHERE health_record_id = $${idx} RETURNING *`,
    values
  );
  return res.rows.length ? rowToHealthRecord(res.rows[0]) : undefined;
};
