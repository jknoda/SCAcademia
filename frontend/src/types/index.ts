export interface Academy {
  id: string;
  name: string;
  location: string;
  email: string;
  phone: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  academy: {
    id: string;
    name: string;
  };
}

export interface JWTResponse {
  accessToken: string;
  user?: User;
}

export interface SetupState {
  step: number;
  academyId?: string;
  academyData?: Academy;
  userData?: User;
}

export interface PasswordStrengthResult {
  score: number; // 0-100
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}
