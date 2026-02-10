import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@sciencebasedbody.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';

  console.log('Seeding admin user...');

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Admin user created/updated: ${admin.email}`);

  // Seed default settings
  const defaultSettings = [
    {
      key: 'wholesale_minimum_order',
      value: '30000',
      type: 'number',
      description: 'Minimum order amount ($) for wholesale/brand-partner checkout',
    },
    {
      key: 'shipping_flat_rate',
      value: '25',
      type: 'number',
      description: 'Standard flat-rate shipping cost ($)',
    },
    {
      key: 'shipping_free_threshold',
      value: '500',
      type: 'number',
      description: 'Order subtotal ($) at which shipping becomes free',
    },
    {
      key: 'shipping_expedited_rate',
      value: '50',
      type: 'number',
      description: 'Expedited shipping cost ($)',
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},  // Don't overwrite if admin already changed it
      create: setting,
    });
  }

  console.log(`Seeded ${defaultSettings.length} default settings`);
  console.log('');
  console.log('='.repeat(50));
  console.log('IMPORTANT: Change the admin password after first login!');
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
