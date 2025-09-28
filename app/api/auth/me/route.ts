import { withAuth } from '../../../../lib/auth/middleware';
import { NextResponse } from 'next/server';

// return details about authenticated user
export const GET = withAuth(async (request) => { 
  const user = request.user; 

  return NextResponse.json({
    success: true,
    data: {
      id: user.userId,
      email: user.email,
      role: user.role,
    },
  });
});