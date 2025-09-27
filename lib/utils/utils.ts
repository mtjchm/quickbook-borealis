import { Role } from '../types/index';

// check whether the authenticated user is allowed to manage this company.

export function isCompanyAdmin(user: any, companyOwnerId: number) {
  if (!user) return false;
  if (user.role === Role.ADMIN) return true; // global admin
  return user.userId === companyOwnerId; // company owner
}