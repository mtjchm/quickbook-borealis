
export enum Role {
  CUSTOMER = "customer",
  PROVIDER = "provider",
  ADMIN = "admin",
}

export enum BookingStatus {
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: Role; 
  iat?: number; 
  exp?: number;  
}

export interface LoginRequest {
  email: string;
  password: string;
}