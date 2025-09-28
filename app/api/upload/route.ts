import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../lib/auth/middleware';
import { prisma } from '../../../lib/prisma/prisma';
import { z } from 'zod';
import { isCompanyAdmin } from '../../../lib/utils/utils';
import { processImageBuffer, uploadBuffer } from '../../../lib/utils/utils';


// POST /api/upload for admin (upload banner/logo)
const bodySchema = z.object({
  companyId: z.preprocess((v) => {
    if (typeof v === 'string' && v.length) return Number(v);
    if (typeof v === 'number') return v;
    return NaN;
  }, z.number().int().positive()),
  type: z.enum(['logo', 'banner']),

  // base64 data URI or plain base64 for image encoding
  imageBase64: z.string().min(100), // no way a png is shorter
});

export const POST = withAuth(async (request: NextRequest) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: z.treeifyError(parsed.error) }, { status: 400 });
  }

  const { companyId, type, imageBase64 } = parsed.data;

  // fetch company to check permissions
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
  }

  const user = (request as any).user;
  if (!isCompanyAdmin(user, company.ownerId)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // decode base64: data URI or raw base64
  let base64 = imageBase64;
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/); // what
  if (match) base64 = match[2];

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid base64 encoding' }, { status: 400 });
  }

  try {
    // process image (crop/resize/convert to png)
    const processed = await processImageBuffer(buffer);
    const blobName = `${companyId}_${type}.png`;
    const url = await uploadBuffer(blobName, processed, 'image/png');

    // set company headerImageUrl
    await prisma.company.update({
      where: { id: companyId },
      data: { headerImageUrl: url },
    });
    return NextResponse.json({ success: true, data: { url, filename: blobName } });

  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ success: false, error: 'Upload failed', details: z.treeifyError(err)}, { status: 500 });
  }
});