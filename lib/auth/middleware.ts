import { NextRequest } from 'next/server';
import { Role, JWTPayload } from '../types';
import { verifyToken, extractTokenFromHeader } from './jwt';

type UserRole = keyof typeof Role; // 'CUSTOMER' | 'PROVIDER' | 'ADMIN'

// Extended request type that includes authenticated user information
// so we can access it in our route handlers
export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

//extract JWT token; verify; return user information
export async function authenticateToken(request: NextRequest): Promise<JWTPayload> {
  try {
    // Get Authorization header from request
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }
    
    // Extract token
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      throw new Error('Invalid authorization header format');
    }
    
    const payload = verifyToken(token); // Verify; get user payload
    
    return payload;
  } catch (error) { // more error handling yay
    throw new Error(`${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// set a role required for route access
export function requireRole(allowedRoles: UserRole[]) {
  return (userRole: UserRole): boolean => allowedRoles.includes(userRole);
}

// Simplified role-checking functions
export const isCustomer = (userRole: UserRole): boolean => userRole === 'CUSTOMER';
export const hasProviderAccess = (userRole: UserRole): boolean => ['PROVIDER', 'ADMIN'].includes(userRole);
export const hasAdminAccess = (userRole: UserRole): boolean => userRole === 'ADMIN';


// check login and auth for api route
export function withAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      // Authenticate the request
      const user = await authenticateToken(request);
      
      // Create an authenticated request object with user information
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;
      
      // Call the original handler with authenticated request
      return await handler(authenticatedRequest, ...args);
    } catch (error) {
      // 401 Unauthorized if authentication fails
      return Response.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error instanceof Error ? error.message : 'Authentication failed'
          }
        },
        { status: 401 }
      );
    }
  };
}

// handle user roles for specific route access (promises are dark magic to me)
export function withRole<T extends any[]>(
  allowedRoles: UserRole[],
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>
) {
  return withAuth(async (request: AuthenticatedRequest, ...args: T): Promise<Response> => {
    // Check if user's role is in the allowed roles array
    if (!requireRole(allowedRoles)(request.user.role as unknown as UserRole)) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to access this resource',
            details: {
              user_role: request.user.role
            }
          }
        },
        { status: 403 }
      );
    }
    
    // User has required role => proceed
    return await handler(request, ...args);
  });
}