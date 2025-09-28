import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { Role, BookingStatus } from '../types';

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
      role: Role.CUSTOMER,
      firstName: 'Alice',
      lastName: 'Smith',
      phone: '123-456-7890',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      passwordHash: 'dev-hash-2',
      role: Role.PROVIDER,
      firstName: 'Bob',
      lastName: 'Johnson',
      phone: '987-654-3210',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: 'dev-hash-admin',
      role: Role.ADMIN,
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
      serviceDescription: 'Professional haircut with wash and styling',
      durationMinutes: 60,
      price: 65.0,
      isActive: true,
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
      serviceDescription: '60-minute relaxing massage session',
      durationMinutes: 60,
      price: 80.0,
      isActive: true,
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
        status: BookingStatus.CONFIRMED,
        customerNotes: 'Please use organic shampoo.',
        providerNotes: 'Prefers window seat.',
        totalPrice: 65.0,
        emailSent: true,
      },
      {
        customerId: alice.id,
        companyId: salon.id,
        bookingDate: new Date('2025-10-01'),
        startTime: new Date('2025-10-01T11:00:00Z'),
        endTime: new Date('2025-10-01T12:00:00Z'),
        status: BookingStatus.COMPLETED,
        customerNotes: 'Style with light gel.',
        providerNotes: 'Short hair.',
        totalPrice: 65.0,
        emailSent: false,
      },
      {
        customerId: alice.id,
        companyId: massage.id,
        bookingDate: new Date('2025-09-29'),
        startTime: new Date('2025-09-29T14:00:00Z'),
        endTime: new Date('2025-09-29T15:00:00Z'),
        status: BookingStatus.CONFIRMED,
        customerNotes: 'Focus on back and shoulders.',
        providerNotes: 'Previous back injury noted.',
        totalPrice: 80.0,
        emailSent: true,
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