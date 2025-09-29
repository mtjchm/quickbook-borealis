import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma/prisma';
import { withAuth } from '../../../../lib/auth/middleware';
import { idParamSchema, patchCompanySchema, companyIdParamSchema } from '../../../../lib/prisma/schemas';

import { isCompanyAdmin } from '../../../../lib/utils/utils';

// GET /api/companies/{id}
// any user can read company details
export const GET = async (request: NextRequest) => {
  // extract id from path and validate
  const rawId = request.nextUrl.pathname.split('/').pop();
  const parsed = companyIdParamSchema.safeParse({ id: rawId });

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid id', details: parsed.error.format() }, { status: 400 });
  }
  const id = parsed.data.id;

  // fetch company
  const company = await prisma.company.findUnique({
    where: { id },
    include: { owner: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });

  if (!company) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const out = {
    id: company.id,
    name: company.name,
    description: company.description,
    headerImageUrl: company.headerImageUrl,
    ownerId: company.ownerId,
    address: company.address,
    phone: company.phone,
    email: company.email,
    serviceName: company.serviceName,
    businessHours: null,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };

  // attempt to parse businessHours JSON string if present
  if (company.businessHours) {
    try {
      out.businessHours = JSON.parse(company.businessHours);
    } catch (e) {
      console.error('Failed to parse businessHours JSON', e);
    }
  }

  // TODO: fetch owner from api/company/{id}/employees/{id} to display info

  return NextResponse.json({ success: true, data: out });
};
// PATCH /api/companies/{id}
// only company owner or global admin may update
export const PATCH = withAuth(async (request: NextRequest) => {
  const rawId = request.nextUrl.pathname.split('/').pop();
  const parsed = companyIdParamSchema.safeParse({ id: rawId });

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid id', details: parsed.error._zod }, { status: 400 });
  }
  const id = parsed.data.id;

  // validate body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const bodyParsed = patchCompanySchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid body', details: bodyParsed.error._zod }, { status: 400 });
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
  const parsed = companyIdParamSchema.safeParse({ id: rawId });

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