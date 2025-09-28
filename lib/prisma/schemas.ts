import { z } from 'zod';

// Common schema for id path param validation
export const idParamSchema = z.object({
  id: z.preprocess((v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.length) return Number(v);
    return NaN;
  }, z.number().int().positive()),
});

export const patchBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  notes: z.string().nullable().optional(),
  startTime: z.string().refine((v) => !Number.isNaN(Date.parse(v))).optional(),
  endTime: z.string().refine((v) => !Number.isNaN(Date.parse(v))).optional(),
  totalPrice: z.union([z.string(), z.number()]).nullable().optional(),
});

export const postBookingSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  companyId: z.number().int().positive(),
  bookingDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'bookingDate must be a valid ISO date string' }),
  startTime: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'startTime must be a valid ISO datetime string' }),
  endTime: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'endTime must be a valid ISO datetime string' }),
  notes: z.string().optional().nullable(),
  totalPrice: z.union([z.string(), z.number()]).optional().nullable(),
});

export const patchCompanySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  serviceName: z.string().nullable().optional(),
  serviceDescription: z.string().nullable().optional(),
  durationMinutes: z.number().int().positive().nullable().optional(),
  price: z.union([z.string(), z.number()]).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const uploadImageSchema = z.object({
  companyId: z.preprocess((v) => {
    if (typeof v === 'string' && v.length) return Number(v);
    if (typeof v === 'number') return v;
    return NaN;
  }, z.number().int().positive()),
  type: z.enum(['logo', 'banner']),

  // base64 data URI or plain base64 for image encoding
  imageBase64: z.string().min(100), // no way a png is shorter
});

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional().nullable(),
});