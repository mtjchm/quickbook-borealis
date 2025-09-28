import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma/prisma';
import { withAuth } from '../../../lib/auth/middleware';
import { postBookingSchema } from '../../../lib/prisma/schemas';
import { sendBookingEmail } from '../../../lib/email/client'; // implemented later
import { Role, BookingResponse, User, CompanyPublic, BookingData } from '../../../lib/types';

// POST /api/bookings
// Requires authentication (withAuth func).
// booking details in the body
export const POST = withAuth(async (request: any) => {
  const raw = await request.json().catch(() => null);
  if (!raw) {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = postBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
  }
  const body = parsed.data;

  // Determine customerId: only allow provider/admin to set arbitrary customerId
  const caller = request.user as { userId: number; role: Role };
  let customerId = caller.userId;
  if (body.customerId && (caller.role === Role.PROVIDER || caller.role === Role.ADMIN)) {
    customerId = body.customerId;
  }

  // Ensure company exists
  const company = await prisma.company.findUnique({ where: { id: body.companyId } });
  if (!company) {
    return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
  }

  try {
    // create booking - Prisma expects Date objects for DateTime fields
    const created = await prisma.booking.create({
      data: {
        customerId,
        companyId: body.companyId,
        bookingDate: new Date(body.bookingDate),
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        notes: body.notes ?? null,
        totalPrice: body.totalPrice == null ? null : String(body.totalPrice),
        status: 'confirmed',
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });

    // normalize response to BookingResponse using your trimmed types
    const bookingOut: BookingResponse = {
      id: created.id,
      customer_id: created.customerId,
      company_id: created.companyId,
      booking_date: created.bookingDate?.toISOString() ?? null,
      start_time: created.startTime?.toISOString() ?? null,
      end_time: created.endTime?.toISOString() ?? null,
      status: created.status,
      notes: created.notes ?? null,
      total_price: created.totalPrice ? String(created.totalPrice) : null,
      email_sent: (created as any).emailSent ?? false,
      created_at: created.createdAt?.toISOString() ?? null,
      updated_at: created.updatedAt?.toISOString() ?? null,
      customer: created.customer
        ? ({
          id: created.customer.id,
          first_name: created.customer.firstName,
          last_name: created.customer.lastName,
          email: created.customer.email,
        } as User)
        : null,
      company: created.company ? ({ id: created.company.id, name: created.company.name } as CompanyPublic) : null,
    };

    // pass the original created booking object to the email client as cast
    (async () => {
      try {
        await sendBookingEmail(created as unknown as BookingData);
      } catch (e) {
        console.error('sendBookingEmail failed', e);
      }
    })();

    return NextResponse.json({ success: true, data: bookingOut }, { status: 201 });
  } catch (err) {
    console.error('Booking create failed', err);
    return NextResponse.json({ success: false, error: 'Create failed' }, { status: 500 });
  }
});

// GET /api/bookings?companyId={id}
// Returns booked time slots for companyId 
const companyIdQuery = z.object({
  companyId: z.preprocess((v) => {
    if (typeof v === 'string' && v.length) return Number(v);
    if (typeof v === 'number') return v;
    return NaN;
  }, z.number().int().positive()),
});

export const GET = withAuth(async (request: any) => {
  const url = new URL(request.url);
  const parsed = companyIdQuery.safeParse({ companyId: url.searchParams.get('companyId') });
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Missing or invalid query parameter: companyId' }, { status: 400 });
  }
  const { companyId } = parsed.data;

  try {
    const bookings = await prisma.booking.findMany({
      where: { companyId },
      select: { startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
      take: 500,
    });

    const dates = bookings.map((b: any) => ({
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
    }));

    return NextResponse.json({ success: true, data: dates, meta: { companyId } });
  } catch (err) {
    console.error('GET bookings failed', err);
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
});
