import { PrismaClient } from "@prisma/client";
import { Role, BookingStatus } from "../lib/types/index";
const dotenv = require("dotenv");

dotenv.config({ path: "./.env.local" });


const prisma = new PrismaClient();
 
async function main() {
  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      passwordHash: 'hashedpassword1',
      role: Role.CUSTOMER,
      firstName: 'Alice',
      lastName: 'Smith',
      phone: '123-456-7890',
    },
  });
 
  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      passwordHash: 'hashedpassword2',
      role: Role.PROVIDER,
      firstName: 'Bob',
      lastName: 'Johnson',
      phone: '987-654-3210',
    },
  });


  const company1 = await prisma.company.create({
    data: {
      name: 'Fresh Cuts Salon',
      description: 'Modern salon for stylish haircuts.',
      headerImageUrl: 'https://example.com/salon1.jpg',
      ownerId: user2.id,
      address: '123 Main St',
      phone: '555-1234',
      email: 'contact@freshcuts.com',
      businessHours: JSON.stringify({
        mon: { open: '09:00', close: '17:00' },
        tue: { open: '09:00', close: '17:00' },
      }),
      serviceName: 'Haircut & Style',
      serviceDescription: 'Professional haircut with wash and styling',
      durationMinutes: 60,
      price: 65.0,
      isActive: true,
    },
  });
 
  const company2 = await prisma.company.create({
    data: {
      name: 'Relax Massage Studio',
      description: 'Relaxing massage therapy studio.',
      headerImageUrl: 'https://example.com/massage1.jpg',
      ownerId: user2.id,
      address: '456 Park Ave',
      phone: '555-5678',
      email: 'info@relaxmassage.com',
      businessHours: JSON.stringify({
        wed: { open: '10:00', close: '18:00' },
        thu: { open: '10:00', close: '18:00' },
      }),
      serviceName: 'Full Body Massage',
      serviceDescription: '60-minute relaxing massage session',
      durationMinutes: 60,
      price: 80.0,
      isActive: true,
    },
  });
 
  // Seed Bookings for company1
  await prisma.booking.create({
    data: {
      customerId: user1.id,
      companyId: company1.id,
      bookingDate: new Date('2025-09-30'),
      startTime: new Date('2025-09-30T09:00:00'),
      endTime: new Date('2025-09-30T10:00:00'),
      status: BookingStatus.CONFIRMED,
      customerNotes: 'Please use organic shampoo.',
      providerNotes: 'Customer prefers window seat.',
      totalPrice: 65.0,
      emailSent: true,
    },
  });
 
  await prisma.booking.create({
    data: {
      customerId: user1.id,
      companyId: company1.id,
      bookingDate: new Date('2025-10-01'),
      startTime: new Date('2025-10-01T11:00:00'),
      endTime: new Date('2025-10-01T12:00:00'),
      status: BookingStatus.COMPLETED,
      customerNotes: 'Style with light gel.',
      providerNotes: 'Customer has short hair.',
      totalPrice: 65.0,
      emailSent: false,
    },
  });
 

  await prisma.booking.create({
    data: {
      customerId: user1.id,
      companyId: company2.id,
      bookingDate: new Date('2025-09-29'),
      startTime: new Date('2025-09-29T14:00:00'),
      endTime: new Date('2025-09-29T15:00:00'),
      status: BookingStatus.CONFIRMED,
      customerNotes: 'Focus on back and shoulders.',
      providerNotes: 'Customer has previous back injury.',
      totalPrice: 80.0,
      emailSent: true,
    },
  });
 
  await prisma.booking.create({
    data: {
      customerId: user1.id,
      companyId: company2.id,
      bookingDate: new Date('2025-10-03'),
      startTime: new Date('2025-10-03T16:00:00'),
      endTime: new Date('2025-10-03T17:00:00'),
      status: BookingStatus.CANCELLED,
      customerNotes: 'Reschedule if possible.',
      providerNotes: 'Customer called to cancel.',
      totalPrice: 80.0,
      emailSent: false,
    },
  });
 
  console.log('Database seeded!');
}
 
main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());