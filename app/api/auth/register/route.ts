import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createTokenResponse } from '../../../../lib/auth/jwt';
import { prisma } from '../../../../lib/prisma/prisma';
import { Role } from '../../../../lib/types'; // import Role enum
import { z } from 'zod';

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional().nullable(),
});

//user registration
export async function POST(request: NextRequest) {
  try {
    const parseResult = registerSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { email, password, firstName, lastName, phone } = parseResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email is already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user - use Role enum value (string) so Prisma gets correct DB value
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: Role.CUSTOMER, // "customer" matches Prisma schema
      },
    });

    // Map Prisma user -> createTokenResponse shape and cast role to Role for TS
    const tokenResponse = createTokenResponse({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role as Role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    });

    const response = NextResponse.json({ success: true, data: tokenResponse });
    response.cookies.set('token', tokenResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error },
      { status: 500 }
    );
  }
}