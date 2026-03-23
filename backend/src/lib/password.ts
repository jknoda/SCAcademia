import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
  return bcrypt.hash(password, rounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres obrigatório');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Pelo menos 1 letra maiúscula obrigatória');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Pelo menos 1 número obrigatório');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Pelo menos 1 caractere especial (!@#$%^&*) obrigatório');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
