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
