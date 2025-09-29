import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma/prisma';
import { companyIdParamSchema } from '../../../../../lib/prisma/schemas';
import { any } from 'zod';

// GET /api/companies/{id}/employees
export async function GET(request: NextRequest) {
    const rawId = request.nextUrl.pathname.split('/').pop();
    const parsed = companyIdParamSchema.safeParse({ id: rawId });

    if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Invalid company id', details: parsed.error.format() }, { status: 400 });
    }
    const companyId = parsed.data.id;

    try {
        const employees = await prisma.user.findMany({
            where: { companyId },
            select: { id: true, firstName: true, lastName: true, email: true },
        });

        const out = employees.map((e: { id: any; firstName: any; lastName: any; email: any; }) => ({ id: e.id, first_name: e.firstName, last_name: e.lastName, email: e.email }));

        return NextResponse.json({ success: true, data: { employees: out } });
    } catch (e) {
        console.error('Failed to fetch employees', e);
        return NextResponse.json({ success: false, error: 'Failed to fetch employees' }, { status: 500 });
    }
}
