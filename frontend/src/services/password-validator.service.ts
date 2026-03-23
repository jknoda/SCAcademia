import { Injectable } from '@angular/core';
import { PasswordStrengthResult } from '../types';

@Injectable({
  providedIn: 'root',
})
export class PasswordValidatorService {
  validatePasswordStrength(password: string): PasswordStrengthResult {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*]/.test(password),
    };

    const score = Object.values(requirements).filter((v) => v).length * 25;

    return {
      score,
      requirements,
    };
  }

  isValidPassword(password: string): boolean {
    const result = this.validatePasswordStrength(password);
    return result.score === 100;
  }

  getPasswordErrors(password: string): string[] {
    const result = this.validatePasswordStrength(password);
    const errors: string[] = [];

    if (!result.requirements.minLength) {
      errors.push('Mínimo 8 caracteres obrigatório');
    }
    if (!result.requirements.hasUppercase) {
      errors.push('Pelo menos 1 letra maiúscula obrigatória');
    }
    if (!result.requirements.hasNumber) {
      errors.push('Pelo menos 1 número obrigatório');
    }
    if (!result.requirements.hasSpecialChar) {
      errors.push('Pelo menos 1 caractere especial (!@#$%^&*) obrigatório');
    }

    return errors;
  }
}
