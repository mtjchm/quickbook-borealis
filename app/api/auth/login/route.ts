import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createTokenResponse } from '../../../../lib/auth/jwt';
import { prisma } from '../../../../lib/prisma/prisma';
import { Role } from '../../../../lib/types';

// user login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validationnn
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find by unique email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}