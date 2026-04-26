export interface AuthUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  onboardingCompleted: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  token?: string | null;
  onboardingCompleted?: boolean;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** POST /auth/reset-password-by-email — oturum yok */
export interface ResetPasswordByEmailRequest {
  email: string;
  newPassword: string;
}
