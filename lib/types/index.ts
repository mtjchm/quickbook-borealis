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

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface CompanyPublic {
  id: number;
  name: string;
}

export interface BookedSlot {
  startTime: string; // ISO
  endTime: string;
}

export interface BookingResponse {
  id: number;
  customer_id: number;
  company_id: number;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string;
  notes?: string | null;
  total_price?: string | null;
  email_sent?: boolean;
  created_at: string | null;
  updated_at: string | null;
  customer?: User | null;
  company?: CompanyPublic | null;
}

export type BookingData = {
  id: number;
  customerId: string;
  companyId: string;
  bookingDate: Date;
  startTime: Date;
  endTime: Date;
  notes: string | null;
  totalPrice: string | null;
  status: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  company: {
    id: string;
    name: string;
  };
};
