import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('search') || '';

        const whereClause = search
            ? { // wont be used for now
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                    { serviceName: { contains: search, mode: 'insensitive' as const } }
                ]
            }
            : {};

        // Get companies with basic public information
        const companies = await prisma.company.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                description: true,
                headerImageUrl: true,
                address: true,
                phone: true,
                email: true,
                businessHours: true,
                serviceName: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const totalCount = await prisma.company.count({
            where: whereClause
        });

        return Response.json({
            success: true,
            data: {
                companies,
                pagination: {
                    page,
                    totalCount
                }
            }
        });

    } catch (error) {
        console.error('Error fetching companies:', error);
        return Response.json(
            {
                success: false,
                status: 500
            }
        );
    } finally {
        await prisma.$disconnect();
    }
}