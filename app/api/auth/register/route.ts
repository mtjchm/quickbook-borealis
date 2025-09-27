import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createTokenResponse } from '../../../../lib/auth/jwt';
import { prisma } from '../../../../lib/prisma/prisma';
import { Role } from '../../../../lib/types'; // import Role enum

//user registration
export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json();

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

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
        phone,
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
      phone: newUser.phone,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    });

    return NextResponse.json({ success: true, data: tokenResponse });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}