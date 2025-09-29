import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma/prisma';
import { companyIdParamSchema, employeeIdParamSchema, patchEmployeeSchema } from '../../../../../../lib/prisma/schemas';
import { withRole } from '../../../../../../lib/auth/middleware';

// GET /api/companies/{companyId}/employees/{employeeId}
// Accessible to admin and provider roles
export const GET = withRole(['ADMIN', 'EMPLOYEE'], async (request, { params }) => {
    try {
        // Parse company ID from URL
        const companyIdParsed = companyIdParamSchema.safeParse({ id: params.id });
        if (!companyIdParsed.success) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'INVALID_COMPANY_ID',
                    message: 'Invalid company ID',
                    details: companyIdParsed.error.format()
                }
            }, { status: 400 });
        }

        // Parse employee ID from URL path
        const pathSegments = request.nextUrl.pathname.split('/');
        const employeeIdRaw = pathSegments[pathSegments.length - 1];
        const employeeIdParsed = employeeIdParamSchema.safeParse({ id: employeeIdRaw });

        if (!employeeIdParsed.success) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'INVALID_EMPLOYEE_ID',
                    message: 'Invalid employee ID',
                    details: employeeIdParsed.error.format()
                }
            }, { status: 400 });
        }

        const companyId = companyIdParsed.data.id;
        const employeeId = employeeIdParsed.data.id;

        // Check if company exists and user has access to it
        const company = await prisma.company.findFirst({
            where: { id: companyId },
            include: { owner: true }
        });

        if (!company) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'COMPANY_NOT_FOUND',
                    message: 'Company not found'
                }
            }, { status: 404 });
        }

        // For provider role, check if they own the company or are an employee
        if (request.user.role === 'employee') {
            const isOwner = company.ownerId === request.user.userId;
            const isEmployee = await prisma.user.findFirst({
                where: {
                    id: request.user.userId,
                    companyId: companyId
                }
            });

            if (!isOwner && !isEmployee) {
                return NextResponse.json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have access to this company'
                    }
                }, { status: 403 });
            }
        }

        // Find the employee
        const employee = await prisma.user.findFirst({
            where: {
                id: employeeId,
                companyId: companyId
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                companyId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!employee) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'EMPLOYEE_NOT_FOUND',
                    message: 'Employee not found in this company'
                }
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                employee: {
                    id: employee.id,
                    first_name: employee.firstName,
                    last_name: employee.lastName,
                    email: employee.email,
                    role: employee.role,
                    company_id: employee.companyId,
                    created_at: employee.createdAt.toISOString(),
                    updated_at: employee.updatedAt.toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Failed to fetch employee:', error);
        return NextResponse.json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to fetch employee'
            }
        }, { status: 500 });
    }
});

// PUT /api/companies/{companyId}/employees/{employeeId}
// Accessible to admin and provider roles
export const PUT = withRole(['ADMIN', 'EMPLOYEE'], async (request, { params }) => {
    try {
        // Parse company ID from URL
        const companyIdParsed = companyIdParamSchema.safeParse({ id: params.id });
        if (!companyIdParsed.success) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'INVALID_COMPANY_ID',
                    message: 'Invalid company ID',
                    details: companyIdParsed.error.format()
                }
            }, { status: 400 });
        }

        // Parse employee ID from URL path
        const pathSegments = request.nextUrl.pathname.split('/');
        const employeeIdRaw = pathSegments[pathSegments.length - 1];
        const employeeIdParsed = employeeIdParamSchema.safeParse({ id: employeeIdRaw });

        if (!employeeIdParsed.success) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'INVALID_EMPLOYEE_ID',
                    message: 'Invalid employee ID',
                    details: employeeIdParsed.error.format()
                }
            }, { status: 400 });
        }

        const companyId = companyIdParsed.data.id;
        const employeeId = employeeIdParsed.data.id;

        // Parse request body
        const body = await request.json();
        const validatedData = patchEmployeeSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: validatedData.error.format()
                }
            }, { status: 400 });
        }

        // Check if company exists and user has access to it
        const company = await prisma.company.findFirst({
            where: { id: companyId },
            include: { owner: true }
        });

        if (!company) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'COMPANY_NOT_FOUND',
                    message: 'Company not found'
                }
            }, { status: 404 });
        }

        // For provider role, check if they own the company
        if (request.user.role === 'employee') {
            const isOwner = company.ownerId === request.user.userId;
            if (!isOwner) {
                return NextResponse.json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You can only update employees in companies you own'
                    }
                }, { status: 403 });
            }
        }

        // Check if employee exists in this company
        const existingEmployee = await prisma.user.findFirst({
            where: {
                id: employeeId,
                companyId: companyId
            }
        });

        if (!existingEmployee) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'EMPLOYEE_NOT_FOUND',
                    message: 'Employee not found in this company'
                }
            }, { status: 404 });
        }

        // Update employee
        const updatedEmployee = await prisma.user.update({
            where: { id: employeeId },
            data: validatedData.data,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                companyId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                employee: {
                    id: updatedEmployee.id,
                    first_name: updatedEmployee.firstName,
                    last_name: updatedEmployee.lastName,
                    email: updatedEmployee.email,
                    role: updatedEmployee.role,
                    company_id: updatedEmployee.companyId,
                    created_at: updatedEmployee.createdAt.toISOString(),
                    updated_at: updatedEmployee.updatedAt.toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Failed to update employee:', error);
        return NextResponse.json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to update employee'
            }
        }, { status: 500 });
    }
});

// DELETE /api/companies/{companyId}/employees/{employeeId}
// Accessible only to admin role
export const DELETE = withRole(['ADMIN'], async (request, { params }) => {
    try {
        // Parse company ID from URL
        const companyIdParsed = companyIdParamSchema.safeParse({ id: params.id });
        if (!companyIdParsed.success) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'INVALID_COMPANY_ID',
                    message: 'Invalid company ID',
                    details: companyIdParsed.error.format()
                }
            }, { status: 400 });
        }

        // Parse employee ID from URL path
        const pathSegments = request.nextUrl.pathname.split('/');
        const employeeIdRaw = pathSegments[pathSegments.length - 1];
        const employeeIdParsed = employeeIdParamSchema.safeParse({ id: employeeIdRaw });

        if (!employeeIdParsed.success) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'INVALID_EMPLOYEE_ID',
                    message: 'Invalid employee ID',
                    details: employeeIdParsed.error.format()
                }
            }, { status: 400 });
        }

        const companyId = companyIdParsed.data.id;
        const employeeId = employeeIdParsed.data.id;

        // Check if employee exists in this company
        const existingEmployee = await prisma.user.findFirst({
            where: {
                id: employeeId,
                companyId: companyId
            }
        });

        if (!existingEmployee) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'EMPLOYEE_NOT_FOUND',
                    message: 'Employee not found in this company'
                }
            }, { status: 404 });
        }

        // Check if this employee owns any companies (company owners shouldn't be deleted)
        const ownedCompanies = await prisma.company.findMany({
            where: { ownerId: employeeId }
        });

        if (ownedCompanies.length > 0) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'CANNOT_DELETE_COMPANY_OWNER',
                    message: 'Cannot delete an employee who owns companies. Transfer ownership first.'
                }
            }, { status: 400 });
        }

        // Remove employee from company (set companyId to null) rather than deleting the user
        // This preserves user data and booking history
        const updatedEmployee = await prisma.user.update({
            where: { id: employeeId },
            data: {
                companyId: null,
                role: 'customer' // Reset role to customer when removed from company
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                companyId: true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                message: 'Employee removed from company successfully',
                employee: {
                    id: updatedEmployee.id,
                    first_name: updatedEmployee.firstName,
                    last_name: updatedEmployee.lastName,
                    email: updatedEmployee.email,
                    role: updatedEmployee.role,
                    company_id: updatedEmployee.companyId
                }
            }
        });

    } catch (error) {
        console.error('Failed to delete employee:', error);
        return NextResponse.json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to delete employee'
            }
        }, { status: 500 });
    }
});
