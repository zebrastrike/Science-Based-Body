import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test accounts...\n');

  const passwordHash = await bcrypt.hash('test12355!', 12);

  // ─── TEST SHOPPER (CLIENT) ──────────────────────────────────────────────────
  const shopper = await prisma.user.upsert({
    where: { email: 'test-shopper@test.com' },
    update: {},
    create: {
      email: 'test-shopper@test.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'Shopper',
      role: 'CLIENT',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`CLIENT: ${shopper.email} / test12355!`);

  // ─── TEST AFFILIATE ─────────────────────────────────────────────────────────
  const affiliateUser = await prisma.user.upsert({
    where: { email: 'test-affiliate@test.com' },
    update: {},
    create: {
      email: 'test-affiliate@test.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'Affiliate',
      role: 'AFFILIATE',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const affiliate = await prisma.affiliate.upsert({
    where: { userId: affiliateUser.id },
    update: {},
    create: {
      userId: affiliateUser.id,
      referralCode: 'TESTAFFL',
      commissionRate: 0.05,
      isActive: true,
    },
  });
  console.log(`AFFILIATE: ${affiliateUser.email} / test12355!`);
  console.log(`  Referral code: ${affiliate.referralCode}`);
  console.log(`  Tracking URL:  https://sbbpeptides.com?ref=${affiliate.referralCode}`);
  console.log(`  Clean redirect: /api/v1/affiliates/r/${affiliate.referralCode}`);

  // ─── TEST BRAND PARTNER ─────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { id: 'test-partner-org' },
    update: {},
    create: {
      id: 'test-partner-org',
      name: 'Test Partner LLC',
      type: 'CLINIC',
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  const priceList = await prisma.priceList.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      name: 'Test Partner Wholesale',
      description: 'Test wholesale pricing — 20% discount',
      discountPercent: 20,
      organizationId: org.id,
      isActive: true,
    },
  });

  const partner = await prisma.user.upsert({
    where: { email: 'test-partner@test.com' },
    update: {},
    create: {
      email: 'test-partner@test.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'Partner',
      role: 'BRAND_PARTNER',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      organizationId: org.id,
      priceListId: priceList.id,
    },
  });
  console.log(`BRAND_PARTNER: ${partner.email} / test12355!`);
  console.log(`  Organization: ${org.name}`);
  console.log(`  Wholesale discount: 20%`);

  // ─── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('TEST ACCOUNTS READY');
  console.log('='.repeat(60));
  console.log('All test account emails deliver to: edward@giddyupp.com');
  console.log('(Configure in your email service / SMTP settings)');
  console.log('');
  console.log('Account          | Email                     | Role');
  console.log('-'.repeat(60));
  console.log('Shopper          | test-shopper@test.com     | CLIENT');
  console.log('Affiliate        | test-affiliate@test.com   | AFFILIATE');
  console.log('Brand Partner    | test-partner@test.com     | BRAND_PARTNER');
  console.log('');
  console.log('Password for all: test12355!');
  console.log('Affiliate ref code: TESTAFFL');
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
