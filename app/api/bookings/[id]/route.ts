import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma/prisma';
import { z } from 'zod';
import { extractTokenFromHeader, verifyToken } from '../../../../lib/auth/jwt';
import { Role } from '../../../../lib/types';
import { withRole, withAuth } from '../../../../lib/auth/middleware'; // added withAuth
import { idParamSchema, patchBookingSchema } from '../../../../lib/prisma/schemas';

/**
 * GET /api/bookings/{id}
 * - If the requester is authenticated AND is the booking owner OR provider/admin:
 *     return the booking details AND an array of booked time slots for the booking's company.
 * - If the requester is unauthenticated OR not authorized to view the booking:
 *     return array of booked time slots for the booking's company.
 */
export async function GET(request: NextRequest) {
  const rawId = request.nextUrl.pathname.split('/').pop();
  const parsed = idParamSchema.safeParse({ id: rawId });

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }
  const bookingId = parsed.data.id;

  // fetch booking with company info
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      company: { select: { id: true, name: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

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

  // Fetch booked slots for the same company (public info)
  const booked = await prisma.booking.findMany({
    where: { companyId: booking.companyId },
    select: { startTime: true, endTime: true },
    orderBy: { startTime: 'asc' },
    take: 500,
  });

  const slots = booked.map((b: any) => ({
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
  }));

  const canSeeBooking =
    !!viewer &&
    (viewer.userId === booking.customerId || viewer.role === Role.PROVIDER || viewer.role === Role.ADMIN);

  if (canSeeBooking) {
    // Return booking details + booked slots array
    const outBooking = {
      id: booking.id,
      customerId: booking.customerId,
      companyId: booking.companyId,
      bookingDate: booking.bookingDate?.toISOString?.() ?? null,
      startTime: booking.startTime?.toISOString?.() ?? null,
      endTime: booking.endTime?.toISOString?.() ?? null,
      status: booking.status,
      totalPrice: booking.totalPrice ? String(booking.totalPrice) : null,
      createdAt: booking.createdAt?.toISOString?.() ?? null,
      updatedAt: booking.updatedAt?.toISOString?.() ?? null,
      company: booking.company,
    };

    return NextResponse.json({ success: true, data: { booking: outBooking, bookedSlots: slots } });
  }

  // Unauthenticated or unauthorized users: return only booked slots (no booking details)
  return NextResponse.json({ success: true, data: { bookedSlots: slots } });
}

// DELETE /api/bookings/{id}; provider or admin 
export const DELETE = withRole(['PROVIDER', 'ADMIN'], async (request: NextRequest) => {
  const rawId = request.nextUrl.pathname.split('/').pop();
  const parsed = idParamSchema.safeParse({ id: rawId });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid id'},
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

/**
 * PATCH /api/bookings/{id}
 * - Only accessible to authenticated users who are:
 *   - ADMIN (global), or
 *   - PROVIDER and are an employee of the booking's company.
 * - Returns 403 with body { success: false, error: 'forbidden' } for unauthorized callers.
 *
 * Notes:
 * - We keep the allowed update fields small for MVP.
 * - Uses zod to validate the patch payload.
 */

export const PATCH = withAuth(async (request: any) => {
  // extract and validate id from path
  const rawId = request.nextUrl.pathname.split('/').pop();
  const parsedId = idParamSchema.safeParse({ id: rawId });
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: 'Invalid id', details: parsedId.error.format() }, { status: 400 });
  }
  const id = parsedId.data.id;

  // parse and validate body
  let rawBody: any;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsedBody = patchBookingSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ success: false, error: 'Invalid body', details: parsedBody.error.format() }, { status: 400 });
  }
  const data = parsedBody.data;

  // fetch booking to check existence and company relationship
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  // check permissions
  const user = request.user as { userId: number; role: Role };
  const client = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { id: true, role: true, companyId: true },
  });

  const isAuthorised = client?.role !== Role.CUSTOMER && client?.companyId === booking.companyId;
  if (!isAuthorised) {
    return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 });
  }
  
  // build update object only with provided fields
  const updateData: any = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
  if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
  if (data.totalPrice !== undefined) updateData.totalPrice = data.totalPrice == null ? null : String(data.totalPrice);

  try {
    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        company: { select: { id: true, name: true } },
        customer: { select: { id: true, firstName: true, lastName: true, email: true} },
      },
    });

    const out = {
      id: updated.id,
      customer_id: updated.customerId,
      company_id: updated.companyId,
      booking_date: updated.bookingDate.toISOString(),
      start_time: updated.startTime.toISOString(),
      end_time: updated.endTime.toISOString(),
      status: updated.status,
      notes: updated.notes ?? null,
      price: updated.totalPrice ? String(updated.totalPrice) : null,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
      customer: updated.customer,
      company: updated.company,
    };

    return NextResponse.json({ success: true, data: out });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
});