import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma/prisma';
import { withAuth } from '../../../../lib/auth/middleware';
import { z } from 'zod';
import { isCompanyAdmin } from '../../../../lib/utils/utils';

// schema to extract id from path
const idParamSchema = z.object({
  id: z.preprocess((v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.length) return Number(v);
    return NaN;
  }, z.number().int().positive()),
});

// PATCH thats why all fields are optional
const companyPatchSchema = z.object({
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

// GET /api/companies/{id}
// only company owner or global admin can read company details
export const GET = withAuth(async (request: NextRequest) => {
  // extract id from path and validate
  const rawId = request.nextUrl.pathname.split('/').pop();
  const parsed = idParamSchema.safeParse({ id: rawId });

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid id', details: parsed.error.format() }, { status: 400 });
  }
  const id = parsed.data.id;

  // fetch company
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  // only owner or global admin (lib/utils/utils.ts)
  const user = (request as any).user;
  if (!isCompanyAdmin(user, company.ownerId)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const out = {
    id: company.id,
    name: company.name,
    description: company.description,
    address: company.address,
    phone: company.phone,
    email: company.email,
    serviceName: company.serviceName,
    serviceDescription: company.serviceDescription,
    durationMinutes: company.durationMinutes,
    price: company.price ? String(company.price) : null,
    isActive: company.isActive,
    owner: company.owner,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };

  return NextResponse.json({ success: true, data: out });
});
// PATCH /api/companies/{id}
// only company owner or global admin may update
export const PATCH = withAuth(async (request: NextRequest) => {
  const rawId = request.nextUrl.pathname.split('/').pop();
  const parsed = idParamSchema.safeParse({ id: rawId });

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid id', details: parsed.error.format() }, { status: 400 });
  }
  const id = parsed.data.id;

  // validate body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const bodyParsed = companyPatchSchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid body', details: bodyParsed.error.format() }, { status: 400 });
  }

  // fetch company to check permissions
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const user = (request as any).user;
  if (!isCompanyAdmin(user, company.ownerId)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // build update data object - only include provided fields
  const updateData: any = {};
  const data = bodyParsed.data;

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.serviceName !== undefined) updateData.serviceName = data.serviceName;
  if (data.serviceDescription !== undefined) updateData.serviceDescription = data.serviceDescription;
  if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.price !== undefined) {
    // prisma Decimal accepts string or number; convert null explicitly
    updateData.price = data.price === null ? null : (typeof data.price === 'string' ? data.price : Number(data.price));
  }

  try {
    const updated = await prisma.company.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    const out = {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      address: updated.address,
      phone: updated.phone,
      email: updated.email,
      serviceName: updated.serviceName,
      serviceDescription: updated.serviceDescription,
      durationMinutes: updated.durationMinutes,
      price: updated.price ? String(updated.price) : null,
      isActive: updated.isActive,
      owner: updated.owner,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: out });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: NextRequest) => {
  const rawId = request.nextUrl.pathname.split('/').pop();
  const parsed = idParamSchema.safeParse({ id: rawId });

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid id', details: parsed.error.format() }, { status: 400 });
  }
  const id = parsed.data.id;

  // fetch company to check permissions
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const user = (request as any).user;
  if (!isCompanyAdmin(user, company.ownerId)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.company.delete({ where: { id } });
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
});