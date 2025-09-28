import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma/prisma';
import { z } from 'zod';
import { withAuth } from '../../../lib/auth/middleware';
import { idParamSchema } from '../../../lib/prisma/schemas';

export const GET = withAuth(async (request: any) => {
  const url = new URL(request.url);
  const raw = { companyId: url.searchParams.get('companyId') };
  const parsed = idParamSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid query id parameter' },
      { status: 400 }
    );
  }

  const { id } = parsed.data;

  try {
    // return booked slots for the requested company so potential customers can see availability
    const bookings = await prisma.booking.findMany({
      where: { id },
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: { startTime: 'asc' }
    });

    // normalize to ISO strings for frontend
    const slots = bookings.map((b: any) => ({
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
    }));

    return NextResponse.json({ success: true, data: slots, meta: { id } });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
});
