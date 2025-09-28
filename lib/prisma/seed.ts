// ...existing code...
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const prisma = new PrismaClient();

async function main() {
  await prisma.booking.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      passwordHash: 'dev-hash-1',
      role: 'customer',
      firstName: 'Alice',
      lastName: 'Smith',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      passwordHash: 'dev-hash-2',
      role: 'provider',
      firstName: 'Bob',
      lastName: 'Johnson',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: 'dev-hash-admin',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  const salon = await prisma.company.create({
    data: {
      name: 'Fresh Cuts Salon',
      description: 'Modern salon for stylish haircuts.',
      headerImageUrl: 'https://example.com/salon1.jpg',
      ownerId: bob.id,
      address: '123 Main St',
      phone: '555-1234',
      email: 'contact@freshcuts.com',
      businessHours: JSON.stringify({ mon: { open: '09:00', close: '17:00' } }),
      serviceName: 'Haircut & Style',
    },
  });

  const massage = await prisma.company.create({
    data: {
      name: 'Relax Massage Studio',
      description: 'Relaxing massage therapy studio.',
      headerImageUrl: 'https://example.com/massage1.jpg',
      ownerId: admin.id,
      address: '456 Park Ave',
      phone: '555-5678',
      email: 'info@relaxmassage.com',
      businessHours: JSON.stringify({ wed: { open: '10:00', close: '18:00' } }),
      serviceName: 'Full Body Massage',
    },
  });

  await prisma.booking.createMany({
    data: [
      {
        customerId: alice.id,
        companyId: salon.id,
        bookingDate: new Date('2025-09-30'),
        startTime: new Date('2025-09-30T09:00:00Z'),
        endTime: new Date('2025-09-30T10:00:00Z'),
        status: 'confirmed',
        notes: 'Please use organic shampoo.',
        totalPrice: 65.0,
      },
      {
        customerId: alice.id,
        companyId: salon.id,
        bookingDate: new Date('2025-10-01'),
        startTime: new Date('2025-10-01T11:00:00Z'),
        endTime: new Date('2025-10-01T12:00:00Z'),
        status: 'completed',
        notes: 'Style with light gel.',
        totalPrice: 65.0,
      },
      {
        customerId: alice.id,
        companyId: massage.id,
        bookingDate: new Date('2025-09-29'),
        startTime: new Date('2025-09-29T14:00:00Z'),
        endTime: new Date('2025-09-29T15:00:00Z'),
        status: 'confirmed',
        totalPrice: 80.0,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// ...existing code...