import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createTokenResponse } from '../../../../lib/auth/jwt';
import { prisma } from '../../../../lib/prisma/prisma';
import { Role } from '../../../../lib/types'; // import Role enum

/**
 * Handles user login.
 * - Validates email and password.
 * - Generates a JWT token if credentials are valid.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Map Prisma user -> createTokenResponse shape and cast role to Role for TS
    const tokenResponse = createTokenResponse({
      id: user.id,
      email: user.email,
      role: user.role as Role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    return NextResponse.json({ success: true, data: tokenResponse });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}