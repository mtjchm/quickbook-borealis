// /lib/auth/jwt.ts
import jwt from 'jsonwebtoken';
import { Role } from '../types';
import dotenv from "dotenv";
import { JWTPayload } from '../types';
dotenv.config({ path: "./.env.local" });


const JWT_SECRET = process.env.JWT_SECRET || 'default';

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    // Ensure JWT_SECRET is properly typed as a string
    if (typeof JWT_SECRET !== 'string' || JWT_SECRET.length === 0) {
      throw new Error('JWT_SECRET must be a non-empty string');
    }

    // jwt.sign() automatically adds 'iat' (issued at) and 'exp' (expires at) fields
    const token = jwt.sign(
      payload,
      JWT_SECRET
    );
    return token;
  } catch (error) {
    console.error('Error signing JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
}

export function verifyToken(token: string): JWTPayload {
  try { // Remove 'Bearer ' prefix since that can sometimes be included in the token string
    const cleanToken = token.replace(/^Bearer\s+/i, '');

    const decoded = jwt.verify(cleanToken, JWT_SECRET) as unknown as JWTPayload;
    return decoded;

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      console.error('JWT verification error:', error);
      throw new Error('Token verification failed');
    }
  }
}

// extract from auth header
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }
  // Assumed to be "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }

  return null;
}

export function createTokenResponse(user: { // create token response object with user info 
  id: number;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  // Generate JWT token for user
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    },
    token
  };
}