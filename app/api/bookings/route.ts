import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma/prisma';
import { z } from 'zod';
import { extractTokenFromHeader, verifyToken } from '../../../lib/auth/jwt';
import { Role } from '../../../lib/types';


const idParamSchema = z.object({
    companyId: z.preprocess((v) => {
    if (typeof v === 'number') return v;
        if (typeof v === 'string' && v.length) return Number(v);
        return NaN;
    }, z.number().int().positive()),
  });

  
//GET /api/bookings
//Public endpoint - returns only "booked out" time slots for a company for unauthenticated users
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const raw = {
    companyId: url.searchParams.get('id')
  };

  const parsed = idParamSchema.safeParse(raw);
  const { companyId } = parsed.data || {};

  // Try to decode token if provided in the header
  let viewer: { userId: number; email: string; role: Role } | null = null;
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (token) {
      const payload = verifyToken(token);
      viewer = { userId: payload.userId, email: payload.email, role: payload.role as Role };
    }
  } catch {
    viewer = null;
  }

  // build query 
  const where: any = { companyId };


  try {
    // If the viewer is logged in and provider or admin, return full booking records.
    if (viewer && (viewer.role === Role.PROVIDER || viewer.role === Role.ADMIN)) {
      const fullBookings = await prisma.booking.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          company: true,
        },
        orderBy: { startTime: 'asc' },
      });

const out = fullBookings.map((b: any) => ({
  id: b.id,
  customerId: b.customerId,
  customer: b.customer,
  companyId: b.companyId,
  company: b.company,
  bookingDate: b.bookingDate.toISOString(),
  startTime: b.startTime.toISOString(),
  endTime: b.endTime.toISOString(),
  status: b.status,
  customerNotes: b.customerNotes,
  providerNotes: b.providerNotes,
  totalPrice: b.totalPrice ? String(b.totalPrice) : null,
  emailSent: b.emailSent,
  createdAt: b.createdAt.toISOString(),
  updatedAt: b.updatedAt.toISOString(),
}));

      return NextResponse.json({ success: true, data: out, meta: { companyId, viewer: { role: viewer.role } } });
    }

    // else return only booked time slots (public view)
    const bookings = await prisma.booking.findMany({
      where,
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({ success: true, data: bookings, meta: { companyId, viewer: viewer ? { role: viewer.role } : null } });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}
