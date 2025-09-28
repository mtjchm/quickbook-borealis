import dotenv from "dotenv";
import { PrismaClient, Prisma } from "@prisma/client";

dotenv.config({ path: "./.env.local" });

const prisma = new PrismaClient();

function uniqueEmail(base = "user") {
    const suffix = Date.now().toString(36).slice(-6);
    return `${base}.${suffix}@example.test`;
}

export async function createUser(
    email?: string,
    firstName?: string,
    lastName?: string,
    passwordHash?: string,
    role?: string
) {
    const resolvedEmail = email ?? uniqueEmail(role ?? "user");
    const resolvedRole = role ?? "customer";
    const data: Prisma.UserCreateInput = {
        email: resolvedEmail,
        passwordHash: passwordHash ?? "dev-hash",
        role: resolvedRole,
        firstName: firstName ?? `${resolvedRole}-first`,
        lastName: lastName ?? `${resolvedRole}-last`,
    };
    return prisma.user.create({ data });
}

export async function createAdminUser(
    email?: string,
    firstName?: string,
    lastName?: string,
    passwordHash?: string
) {
    return createUser(email, firstName, lastName, passwordHash, "admin");
}

export async function createProviderUser(
    email?: string,
    firstName?: string,
    lastName?: string,
    passwordHash?: string
) {
    return createUser(email, firstName, lastName, passwordHash, "provider");
}

export async function createCustomerUser(
    email?: string,
    firstName?: string,
    lastName?: string,
    passwordHash?: string
) {
    return createUser(email, firstName, lastName, passwordHash, "customer");
}

export async function createCompany(opts?: {
    name?: string;
    ownerId?: number;
    ownerEmail?: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    headerImageUrl?: string;
    businessHours?: object | string;
    serviceName?: string;
}) {
    let ownerId = opts?.ownerId;
    if (!ownerId) {
        const owner = await createProviderUser(opts?.ownerEmail);
        ownerId = owner.id;
    }

    const company = await prisma.company.create({
        data: {
            name: opts?.name ?? `Company ${Date.now().toString(36).slice(-4)}`,
            description: opts?.description ?? null,
            headerImageUrl: opts?.headerImageUrl ?? null,
            ownerId,
            address: opts?.address ?? null,
            phone: opts?.phone ?? null,
            email: opts?.email ?? null,
            businessHours:
                typeof opts?.businessHours === "string"
                    ? opts?.businessHours
                    : opts?.businessHours
                        ? JSON.stringify(opts.businessHours)
                        : null,
            serviceName: opts?.serviceName ?? null,
        },
    });

    return prisma.company.findUnique({ where: { id: company.id }, include: { owner: true } });
}


export async function deleteUserByEmail(email: string) {
    return prisma.user.deleteMany({ where: { email } });
}

export async function clear() {
    // use with caution — intended for local test DB
    await prisma.booking.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});
}


export async function disconnect() {
    await prisma.$disconnect();
}
