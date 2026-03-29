import Joi from 'joi';

export const academyFormSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome deve ter ao menos 2 caracteres',
    'string.max': 'Nome não pode exceder 255 caracteres',
    'any.required': 'Nome é obrigatório',
  }),
  location: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Localização deve ter ao menos 2 caracteres',
    'any.required': 'Localização é obrigatória',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório',
  }),
  phone: Joi.string().regex(/^\d{10,15}$/).required().messages({
    'string.pattern.base': 'Telefone deve ter entre 10-15 dígitos',
    'any.required': 'Telefone é obrigatório',
  }),
  fantasyName: Joi.string().max(255).allow('').optional(),
  logoUrl: Joi.string().max(4000000).allow('').optional(),
});

export const adminRegistrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Senha deve ter ao menos 8 caracteres',
    'any.required': 'Senha é obrigatória',
  }),
  fullName: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome completo deve ter ao menos 2 caracteres',
    'any.required': 'Nome completo é obrigatório',
  }),
  photoUrl: Joi.string().max(4000000).allow('').optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Senha é obrigatória',
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório',
  }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token é obrigatório',
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'Senha deve ter ao menos 8 caracteres',
    'any.required': 'Nova senha é obrigatória',
  }),
});

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^\d{10,15}$/;

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

/** Schema used by Responsavel/Admin to create a full health screening record */
export const healthScreeningCreateSchema = Joi.object({
  bloodType: Joi.string().valid(...BLOOD_TYPES).required().messages({
    'any.only': `Tipo sanguíneo deve ser um de: ${BLOOD_TYPES.join(', ')}`,
    'any.required': 'Tipo sanguíneo é obrigatório',
  }),
  weightKg: Joi.number().min(10).max(300).optional().messages({
    'number.min': 'Peso deve ser entre 10 e 300 kg',
  }),
  heightCm: Joi.number().min(100).max(250).optional().messages({
    'number.min': 'Altura deve ser entre 100 e 250 cm',
  }),
  hypertension: Joi.boolean().optional(),
  diabetes: Joi.boolean().optional(),
  cardiac: Joi.boolean().optional(),
  labyrinthitis: Joi.boolean().optional(),
  asthmaBronchitis: Joi.boolean().optional(),
  epilepsySeizures: Joi.boolean().optional(),
  stressDepression: Joi.boolean().optional(),
  healthScreeningNotes: Joi.string().max(2000).allow('').optional(),
  allergies: Joi.string().max(2000).allow('').optional(),
  medications: Joi.string().max(2000).allow('').optional(),
  existingConditions: Joi.string().max(2000).allow('').optional(),
  emergencyContactName: Joi.string().min(2).max(255).required().messages({
    'any.required': 'Nome do contato de emergência é obrigatório',
  }),
  emergencyContactPhone: Joi.string().regex(/^\d{10,15}$/).required().messages({
    'string.pattern.base': 'Telefone de emergência deve ter entre 10-15 dígitos',
    'any.required': 'Telefone de emergência é obrigatório',
  }),
});

/** Schema used by Admin for full update */
export const healthScreeningUpdateSchema = Joi.object({
  bloodType: Joi.string().valid(...BLOOD_TYPES).optional(),
  weightKg: Joi.number().min(10).max(300).optional(),
  heightCm: Joi.number().min(100).max(250).optional(),
  hypertension: Joi.boolean().optional(),
  diabetes: Joi.boolean().optional(),
  cardiac: Joi.boolean().optional(),
  labyrinthitis: Joi.boolean().optional(),
  asthmaBronchitis: Joi.boolean().optional(),
  epilepsySeizures: Joi.boolean().optional(),
  stressDepression: Joi.boolean().optional(),
  healthScreeningNotes: Joi.string().max(2000).allow('').optional(),
  allergies: Joi.string().max(2000).allow('').optional(),
  medications: Joi.string().max(2000).allow('').optional(),
  existingConditions: Joi.string().max(2000).allow('').optional(),
  emergencyContactName: Joi.string().min(2).max(255).optional(),
  emergencyContactPhone: Joi.string().regex(/^\d{10,15}$/).optional(),
}).min(1).messages({
  'object.min': 'Informe ao menos um campo para atualizar',
});

/** Schema used by Professor (notes only) */
export const healthScreeningNotesSchema = Joi.object({
  healthScreeningNotes: Joi.string().max(2000).allow('').required().messages({
    'any.required': 'Notas de triagem são obrigatórias',
  }),
});

export const consentSignSchema = Joi.object({
  signatureBase64: Joi.string().min(100).required().messages({
    'string.min': 'Assinatura inválida',
    'any.required': 'Assinatura é obrigatória',
  }),
});

export const publishConsentTemplatesSchema = Joi.object({
  healthContent: Joi.string().min(20).required().messages({
    'string.min': 'Texto de Saúde deve ter ao menos 20 caracteres',
    'any.required': 'Texto de Saúde é obrigatório',
  }),
  ethicsContent: Joi.string().min(20).required().messages({
    'string.min': 'Texto de Ética deve ter ao menos 20 caracteres',
    'any.required': 'Texto de Ética é obrigatório',
  }),
  privacyContent: Joi.string().min(20).required().messages({
    'string.min': 'Texto de Privacidade deve ter ao menos 20 caracteres',
    'any.required': 'Texto de Privacidade é obrigatório',
  }),
  bumpType: Joi.string().valid('minor', 'major').default('minor').messages({
    'any.only': 'Tipo de versão deve ser minor ou major',
  }),
});

export const deletionRequestSchema = Joi.object({
  reason: Joi.string().max(500).allow('').optional(),
});

export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[0-9]/, 'number')
    .pattern(/[^A-Za-z0-9]/, 'special')
    .required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 8 caracteres',
      'string.pattern.name': 'Senha deve conter {{#name}}',
      'any.required': 'Senha é obrigatória',
    }),
  fullName: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome completo deve ter ao menos 2 caracteres',
    'any.required': 'Nome completo é obrigatório',
  }),
  role: Joi.string().valid('Professor', 'Aluno').required().messages({
    'any.only': 'Tipo deve ser Professor ou Aluno',
    'any.required': 'Tipo é obrigatório',
  }),
  academyId: Joi.string().uuid().required().messages({
    'any.required': 'Academia é obrigatória',
  }),
  birthDate: Joi.date().iso().optional().messages({
    'date.format': 'Data de nascimento deve estar no formato ISO (YYYY-MM-DD)',
  }),
  responsavelEmail: Joi.string().email().optional().messages({
    'string.email': 'Email do responsável deve ser válido',
  }),
});

const documentIdRegex = /^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})$/;
const postalCodeRegex = /^\d{5}-?\d{3}$/;
const stateRegex = /^[A-Z]{2}$/;
const imageDataSchema = Joi.string().max(4000000).allow('').optional();

export const academyProfileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome deve ter ao menos 2 caracteres',
    'any.required': 'Nome é obrigatório',
  }),
  fantasyName: Joi.string().max(255).allow('').optional(),
  logoUrl: imageDataSchema,
  description: Joi.string().max(2000).allow('').optional(),
  documentId: Joi.string().pattern(documentIdRegex).required().messages({
    'string.pattern.base': 'Documento deve estar no formato CNPJ ou CPF válido',
    'any.required': 'Documento é obrigatório',
  }),
  contactEmail: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório',
  }),
  contactPhone: Joi.string().min(10).max(20).required().messages({
    'string.min': 'Telefone deve ter ao menos 10 caracteres',
    'any.required': 'Telefone é obrigatório',
  }),
  addressStreet: Joi.string().max(255).allow('').optional(),
  addressNumber: Joi.string().max(10).allow('').optional(),
  addressComplement: Joi.string().max(255).allow('').optional(),
  addressNeighborhood: Joi.string().max(100).allow('').optional(),
  addressPostalCode: Joi.string().pattern(postalCodeRegex).allow('').optional().messages({
    'string.pattern.base': 'CEP deve estar no formato 00000-000',
  }),
  addressCity: Joi.string().max(100).allow('').optional(),
  addressState: Joi.string().uppercase().pattern(stateRegex).allow('').optional().messages({
    'string.pattern.base': 'UF deve conter 2 letras maiúsculas',
  }),
});

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

export const userProfileUpdateSchema = Joi.object({
  fullName: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome completo deve ter ao menos 2 caracteres',
    'any.required': 'Nome completo é obrigatório',
  }),
  photoUrl: imageDataSchema,
  documentId: Joi.string().pattern(cpfRegex).allow('').optional().messages({
    'string.pattern.base': 'CPF deve estar no formato 000.000.000-00',
  }),
  birthDate: Joi.date().iso().max('now').allow('', null).optional().messages({
    'date.max': 'Data de nascimento não pode ser no futuro',
    'date.format': 'Data de nascimento deve estar no formato YYYY-MM-DD',
  }),
  phone: Joi.string().min(10).max(20).allow('').optional(),
  addressStreet: Joi.string().max(255).allow('').optional(),
  addressNumber: Joi.string().max(10).allow('').optional(),
  addressComplement: Joi.string().max(255).allow('').optional(),
  addressNeighborhood: Joi.string().max(100).allow('').optional(),
  addressPostalCode: Joi.string().pattern(postalCodeRegex).allow('').optional().messages({
    'string.pattern.base': 'CEP deve estar no formato 00000-000',
  }),
  addressCity: Joi.string().max(100).allow('').optional(),
  addressState: Joi.string().uppercase().pattern(stateRegex).allow('').optional().messages({
    'string.pattern.base': 'UF deve conter 2 letras maiúsculas',
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Senha atual é obrigatória',
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[0-9]/, 'number')
    .pattern(/[^A-Za-z0-9]/, 'special')
    .required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 8 caracteres',
      'string.pattern.name': 'Senha deve conter {{#name}}',
      'any.required': 'Nova senha é obrigatória',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Confirmação de senha deve ser igual à nova senha',
    'any.required': 'Confirmação de senha é obrigatória',
  }),
});

export const professorCreateSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[0-9]/, 'number')
    .pattern(/[^A-Za-z0-9]/, 'special')
    .required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 8 caracteres',
      'string.pattern.name': 'Senha deve conter {{#name}}',
      'any.required': 'Senha temporária é obrigatória',
    }),
  fullName: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome completo deve ter ao menos 2 caracteres',
    'any.required': 'Nome completo é obrigatório',
  }),
  photoUrl: imageDataSchema,
  documentId: Joi.string().pattern(cpfRegex).allow('').optional().messages({
    'string.pattern.base': 'CPF inválido',
  }),
  birthDate: Joi.date().iso().max('now').allow('', null).optional().messages({
    'date.max': 'Data de nascimento não pode ser no futuro',
    'date.format': 'Data de nascimento deve estar no formato YYYY-MM-DD',
  }),
  phone: Joi.string().min(10).max(20).allow('').optional(),
  addressStreet: Joi.string().max(255).allow('').optional(),
  addressNumber: Joi.string().max(10).allow('').optional(),
  addressComplement: Joi.string().max(255).allow('').optional(),
  addressNeighborhood: Joi.string().max(100).allow('').optional(),
  addressPostalCode: Joi.string().pattern(postalCodeRegex).allow('').optional().messages({
    'string.pattern.base': 'CEP deve estar no formato 00000-000',
  }),
  addressCity: Joi.string().max(100).allow('').optional(),
  addressState: Joi.string().uppercase().pattern(stateRegex).allow('').optional().messages({
    'string.pattern.base': 'UF deve conter 2 letras maiúsculas',
  }),
  dataEntrada: Joi.date().iso().allow('', null).optional(),
});

export const professorUpdateSchema = Joi.object({
  fullName: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome completo deve ter ao menos 2 caracteres',
    'any.required': 'Nome completo é obrigatório',
  }),
  photoUrl: imageDataSchema,
  documentId: Joi.string().pattern(cpfRegex).allow('').optional().messages({
    'string.pattern.base': 'CPF inválido',
  }),
  birthDate: Joi.date().iso().max('now').allow('', null).optional().messages({
    'date.max': 'Data de nascimento não pode ser no futuro',
    'date.format': 'Data de nascimento deve estar no formato YYYY-MM-DD',
  }),
  phone: Joi.string().min(10).max(20).allow('').optional(),
  addressStreet: Joi.string().max(255).allow('').optional(),
  addressNumber: Joi.string().max(10).allow('').optional(),
  addressComplement: Joi.string().max(255).allow('').optional(),
  addressNeighborhood: Joi.string().max(100).allow('').optional(),
  addressPostalCode: Joi.string().pattern(postalCodeRegex).allow('').optional().messages({
    'string.pattern.base': 'CEP deve estar no formato 00000-000',
  }),
  addressCity: Joi.string().max(100).allow('').optional(),
  addressState: Joi.string().uppercase().pattern(stateRegex).allow('').optional().messages({
    'string.pattern.base': 'UF deve conter 2 letras maiúsculas',
  }),
  dataEntrada: Joi.date().iso().allow('', null).optional(),
});

export const professorStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'Status é obrigatório',
  }),
});

export const adminResetProfessorPasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[0-9]/, 'number')
    .pattern(/[^A-Za-z0-9]/, 'special')
    .required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 8 caracteres',
      'string.pattern.name': 'Senha deve conter {{#name}}',
      'any.required': 'Nova senha é obrigatória',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Confirmação de senha deve ser igual à nova senha',
    'any.required': 'Confirmação de senha é obrigatória',
  }),
});

export const studentCreateSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[0-9]/, 'number')
    .pattern(/[^A-Za-z0-9]/, 'special')
    .required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 8 caracteres',
      'string.pattern.name': 'Senha deve conter {{#name}}',
      'any.required': 'Senha temporária é obrigatória',
    }),
  fullName: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome completo deve ter ao menos 2 caracteres',
    'any.required': 'Nome completo é obrigatório',
  }),
  photoUrl: imageDataSchema,
  isMinor: Joi.boolean().optional(),
  documentId: Joi.string().pattern(cpfRegex).allow('').optional().messages({
    'string.pattern.base': 'CPF inválido',
  }),
  birthDate: Joi.date().iso().max('now').required().messages({
    'date.max': 'Data de nascimento não pode ser no futuro',
    'date.format': 'Data de nascimento deve estar no formato YYYY-MM-DD',
    'any.required': 'Data de nascimento é obrigatória',
  }),
  phone: Joi.string().min(10).max(20).allow('').optional(),
  addressStreet: Joi.string().max(255).allow('').optional(),
  addressNumber: Joi.string().max(10).allow('').optional(),
  addressComplement: Joi.string().max(255).allow('').optional(),
  addressNeighborhood: Joi.string().max(100).allow('').optional(),
  addressPostalCode: Joi.string().pattern(postalCodeRegex).allow('').optional().messages({
    'string.pattern.base': 'CEP deve estar no formato 00000-000',
  }),
  addressCity: Joi.string().max(100).allow('').optional(),
  addressState: Joi.string().uppercase().pattern(stateRegex).allow('').optional().messages({
    'string.pattern.base': 'UF deve conter 2 letras maiúsculas',
  }),
  dataEntrada: Joi.date().iso().allow('', null).optional(),
  turmaId: Joi.string().uuid().allow('', null).optional(),
  responsavelEmail: Joi.string().email().allow('').optional().messages({
    'string.email': 'Email do responsável deve ser válido',
  }),
});

export const studentUpdateSchema = Joi.object({
  fullName: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome completo deve ter ao menos 2 caracteres',
    'any.required': 'Nome completo é obrigatório',
  }),
  photoUrl: imageDataSchema,
  isMinor: Joi.boolean().optional(),
  documentId: Joi.string().pattern(cpfRegex).allow('').optional().messages({
    'string.pattern.base': 'CPF inválido',
  }),
  birthDate: Joi.date().iso().max('now').required().messages({
    'date.max': 'Data de nascimento não pode ser no futuro',
    'date.format': 'Data de nascimento deve estar no formato YYYY-MM-DD',
    'any.required': 'Data de nascimento é obrigatória',
  }),
  phone: Joi.string().min(10).max(20).allow('').optional(),
  addressStreet: Joi.string().max(255).allow('').optional(),
  addressNumber: Joi.string().max(10).allow('').optional(),
  addressComplement: Joi.string().max(255).allow('').optional(),
  addressNeighborhood: Joi.string().max(100).allow('').optional(),
  addressPostalCode: Joi.string().pattern(postalCodeRegex).allow('').optional().messages({
    'string.pattern.base': 'CEP deve estar no formato 00000-000',
  }),
  addressCity: Joi.string().max(100).allow('').optional(),
  addressState: Joi.string().uppercase().pattern(stateRegex).allow('').optional().messages({
    'string.pattern.base': 'UF deve conter 2 letras maiúsculas',
  }),
  dataEntrada: Joi.date().iso().allow('', null).optional(),
});

export const studentStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'Status é obrigatório',
  }),
});

export const guardianSearchSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório',
  }),
});

export const linkGuardianSchema = Joi.object({
  guardianId: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required().messages({
    'string.guid': 'guardianId deve ser um UUID válido',
    'any.required': 'guardianId é obrigatório',
  }),
  relationship: Joi.string().max(120).allow('').optional(),
  isPrimary: Joi.boolean().optional(),
});

export const createAndLinkGuardianSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório',
  }),
  fullName: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome completo deve ter ao menos 2 caracteres',
    'any.required': 'Nome completo é obrigatório',
  }),
  relationship: Joi.string().max(120).allow('').optional(),
  isPrimary: Joi.boolean().optional(),
  documentId: Joi.string().pattern(cpfRegex).allow('').optional().messages({
    'string.pattern.base': 'CPF inválido',
  }),
  phone: Joi.string().min(10).max(20).allow('').optional(),
});

const adminManagedRoleSchema = Joi.string()
  .valid('Admin', 'Professor', 'Aluno', 'Responsavel')
  .messages({
    'any.only': 'Role inválido. Use Admin, Professor, Aluno ou Responsavel',
  });

export const adminManagedUserCreateSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório',
  }),
  fullName: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome completo deve ter ao menos 2 caracteres',
    'any.required': 'Nome completo é obrigatório',
  }),
  role: adminManagedRoleSchema.required().messages({
    'any.required': 'Role é obrigatório',
  }),
  isActive: Joi.boolean().optional(),
  sendInvite: Joi.boolean().optional(),
});

export const adminManagedUserUpdateSchema = Joi.object({
  fullName: Joi.string().min(2).max(255).optional(),
  role: adminManagedRoleSchema.optional(),
  isActive: Joi.boolean().optional(),
  reason: Joi.string().max(255).allow('').optional(),
}).or('fullName', 'role', 'isActive', 'reason');

export const adminManagedUserDeleteSchema = Joi.object({
  reason: Joi.string().max(255).allow('').optional(),
});

export const backupTriggerSchema = Joi.object({
  includeHistory: Joi.boolean().optional().default(false),
  isEncrypted: Joi.boolean().optional().default(false),
  encryptionPassword: Joi.string().min(8).when('isEncrypted', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.allow('', null).optional(),
  }).messages({
    'string.min': 'Senha de criptografia deve ter ao menos 8 caracteres',
    'any.required': 'Senha de criptografia é obrigatória quando o backup é criptografado',
  }),
});

export const backupRestoreSchema = Joi.object({
  adminPassword: Joi.string().min(1).required().messages({
    'string.empty': 'Senha do administrador é obrigatória',
    'any.required': 'Senha do administrador é obrigatória',
  }),
  encryptionPassword: Joi.string().min(8).allow('', null).optional().messages({
    'string.min': 'Senha de criptografia deve ter ao menos 8 caracteres',
  }),
});

export const backupScheduleUpsertSchema = Joi.object({
  hour: Joi.number().integer().min(0).max(23).required().messages({
    'number.base': 'Hora deve ser numérica',
    'number.min': 'Hora deve estar entre 0 e 23',
    'number.max': 'Hora deve estar entre 0 e 23',
    'any.required': 'Hora é obrigatória',
  }),
  minute: Joi.number().integer().min(0).max(59).required().messages({
    'number.base': 'Minuto deve ser numérico',
    'number.min': 'Minuto deve estar entre 0 e 59',
    'number.max': 'Minuto deve estar entre 0 e 59',
    'any.required': 'Minuto é obrigatório',
  }),
  enabled: Joi.boolean().required().messages({
    'any.required': 'Flag enabled é obrigatória',
  }),
  retentionDays: Joi.number().integer().min(7).max(90).optional().default(30).messages({
    'number.min': 'Retenção mínima é de 7 dias',
    'number.max': 'Retenção máxima é de 90 dias',
  }),
});
