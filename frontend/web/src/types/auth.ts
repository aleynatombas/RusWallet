export interface AuthUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuthResponse {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  token: string | null;
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
