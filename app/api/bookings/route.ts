import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma/prisma';
import { withAuth } from '../../../lib/auth/middleware';
import { extractTokenFromHeader, verifyToken } from '../../../lib/auth/jwt';
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

  // customerId is from the authenticated user
  const caller = request.user as { userId: number; role: Role };
  const customerId = caller.userId;

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

export const GET = async (request: any) => {
  const url = new URL(request.url);
  const parsed = companyIdQuery.safeParse({ companyId: url.searchParams.get('companyId') });
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Missing or invalid query parameter: companyId' }, { status: 400 });
  }
  const { companyId } = parsed.data;

  // try to get a token from cookie or header; if present, verify to determine viewer role
  let viewer: { userId: number; email: string; role: Role } | null = null;
  try {
    const tokenFromCookie = request.cookies?.get?.('token')?.value;
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = extractTokenFromHeader(authHeader);
    const token = tokenFromCookie || tokenFromHeader;
    if (token) {
      const payload = verifyToken(token);
      viewer = { userId: payload.userId, email: payload.email, role: payload.role as Role };
    }
  } catch (e) {
    viewer = null;
  }

  try {
    if (viewer && (viewer.role === Role.EMPLOYEE || viewer.role === Role.ADMIN)) {
      // provider/admin: return full booking details for management
      const bookings = await prisma.booking.findMany({
        where: { companyId },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          company: { select: { id: true, name: true } },
        },
        orderBy: { startTime: 'asc' },
        take: 500,
      });

      const out = bookings.map((b: any) => ({
        id: b.id,
        customer_id: b.customerId,
        company_id: b.companyId,
        booking_date: b.bookingDate?.toISOString() ?? null,
        start_time: b.startTime?.toISOString() ?? null,
        end_time: b.endTime?.toISOString() ?? null,
        status: b.status,
        notes: b.notes ?? null,
        total_price: b.totalPrice ? String(b.totalPrice) : null,
        created_at: b.createdAt?.toISOString() ?? null,
        updated_at: b.updatedAt?.toISOString() ?? null,
        customer: b.customer
          ? {
            id: b.customer.id,
            first_name: b.customer.firstName,
            last_name: b.customer.lastName,
            email: b.customer.email,
          }
          : null,
        company: b.company ? { id: b.company.id, name: b.company.name } : null,
      }));

      return NextResponse.json({ success: true, data: out, meta: { companyId } });
    }

    // public: return booked slots (start/end) only
    const slots = await prisma.booking.findMany({
      where: { companyId },
      select: { startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
      take: 500,
    });

    const dates = slots.map((b: any) => ({ startTime: b.startTime.toISOString(), endTime: b.endTime.toISOString() }));
    return NextResponse.json({ success: true, data: dates, meta: { companyId } });
  } catch (err) {
    console.error('GET bookings failed', err);
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
};
