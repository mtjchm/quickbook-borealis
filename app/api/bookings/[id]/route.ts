// ...existing code...
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma/prisma';
import { withAuth } from '../../../../lib/auth/middleware';
import { withRole } from '../../../../lib/auth/middleware';
import { z } from 'zod';
import { Role } from '../../../../lib/types';

// schema to extract id from path
const idParamSchema = z.object({
  id: z.preprocess((v) => {
    // If it's already a number, return; if it's a string, cast to Number
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.length) return Number(v);
    return NaN;
  }, z.number().int().positive()),
});

// GET /api/bookings/{id}
// Visible to an authenticated user to view their booking
// Providers and admins view any
export const GET = withAuth(async (request: NextRequest) => {
  // extract raw id 
  const rawId = request.nextUrl.pathname.split('/').pop();
  const parsed = idParamSchema.safeParse({ id: rawId });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid id'},
      { status: 400 }
    );
  }

  const id = parsed.data.id;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
      company: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  // allow if client is the booking customer
  if ((request as any).user?.userId === booking.customerId) {
    return NextResponse.json({ success: true, data: booking });
  }

  // otherwise only providers or admins may view
  const allowed = [Role.PROVIDER, Role.ADMIN];
  if (!allowed.includes((request as any).user?.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: booking });
});

// DELETE /api/bookings/{id}; provider or admin 
export const DELETE = withRole(['PROVIDER', 'ADMIN'], async (request: NextRequest) => {
  const rawId = request.nextUrl.pathname.split('/').pop();
  const parsed = idParamSchema.safeParse({ id: rawId });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid id', details: parsed.error.format() },
      { status: 400 }
    );
  }

  const id = parsed.data.id;

  try {
    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
});