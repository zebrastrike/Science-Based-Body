import { PrismaClient, ProductCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting quick database seed...');

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPasswordHash = await bcrypt.hash('admin123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@sciencebasedbody.com' },
    update: {},
    create: {
      email: 'admin@sciencebasedbody.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log('✅ Admin user created (admin@sciencebasedbody.com / admin123!)');

  // Create sample products
  console.log('📦 Creating sample products...');

  const products = [
    {
      sku: 'BPC-157-5MG',
      name: 'BPC-157 (5mg)',
      slug: 'bpc-157-5mg',
      category: ProductCategory.RESEARCH_PEPTIDES,
      shortDescription: 'High purity BPC-157 peptide for research purposes only.',
      basePrice: new Decimal(49.99),
      purityPercent: 99.5,
      isFeatured: true,
    },
    {
      sku: 'TB500-5MG',
      name: 'TB-500 (5mg)',
      slug: 'tb500-5mg',
      category: ProductCategory.RESEARCH_PEPTIDES,
      shortDescription: 'Premium TB-500 thymosin beta-4 fragment for research.',
      basePrice: new Decimal(54.99),
      purityPercent: 99.2,
      isFeatured: true,
    },
    {
      sku: 'SEMA-3MG',
      name: 'Semaglutide (3mg)',
      slug: 'semaglutide-3mg',
      category: ProductCategory.RESEARCH_PEPTIDES,
      shortDescription: 'GLP-1 receptor agonist peptide for research applications.',
      basePrice: new Decimal(89.99),
      purityPercent: 99.8,
      isFeatured: true,
    },
    {
      sku: 'BAC-WATER-30ML',
      name: 'Bacteriostatic Water (30ml)',
      slug: 'bacteriostatic-water-30ml',
      category: ProductCategory.LABORATORY_ADJUNCTS,
      shortDescription: 'Sterile bacteriostatic water for reconstitution.',
      basePrice: new Decimal(9.99),
      isFeatured: false,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        ...product,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${products.length} products`);

  // Create a test customer
  console.log('👤 Creating test customer...');
  const customerPasswordHash = await bcrypt.hash('test123!', 12);

  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: customerPasswordHash,
      firstName: 'Test',
      lastName: 'Customer',
      role: 'CLIENT',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log('✅ Test customer created (test@example.com / test123!)');

  // Create welcome promo discount codes
  console.log('🎟️  Creating welcome promo discounts...');

  await prisma.discount.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: 'First-time visitor welcome discount — 10% off orders under $500',
      type: 'PERCENTAGE',
      value: new Decimal(10),
      maxDiscountAmount: new Decimal(50), // cap at $50
      perUserLimit: 1,
      status: 'ACTIVE',
      productIds: [],
      categoryIds: [],
      userIds: [],
    },
  });

  await prisma.discount.upsert({
    where: { code: 'WELCOME15' },
    update: {},
    create: {
      code: 'WELCOME15',
      description: 'First-time visitor welcome discount — 15% off orders $500+',
      type: 'PERCENTAGE',
      value: new Decimal(15),
      minOrderAmount: new Decimal(500),
      perUserLimit: 1,
      status: 'ACTIVE',
      productIds: [],
      categoryIds: [],
      userIds: [],
    },
  });
  console.log('✅ Welcome promo discounts created (WELCOME10, WELCOME15)');

  // Create default marketing popup
  console.log('📢 Creating default marketing popup...');
  await prisma.marketingPopup.upsert({
    where: { id: 'default-welcome-popup' },
    update: {},
    create: {
      id: 'default-welcome-popup',
      name: 'Welcome Discount Popup',
      isActive: true,
      headline: 'Welcome to SBB',
      subtitle: 'Join our research community and unlock your first-order discount.',
      tier1Value: '10%',
      tier1Label: 'Orders under $500',
      tier2Value: '15%',
      tier2Label: 'Orders $500+',
      showEmailCapture: true,
      ctaText: 'Unlock',
      discountCode: 'WELCOME10',
      discountCode2: 'WELCOME15',
      successHeadline: "You're In!",
      successMessage: 'Use <strong>WELCOME10</strong> for 10% off, or <strong>WELCOME15</strong> for 15% off orders $500+.',
      delayMs: 3500,
      showOnPages: ['index.html', 'shop.html'],
      showFrequency: 'once',
      priority: 10,
    },
  });
  console.log('✅ Default marketing popup created');

  console.log('\n🎉 Database seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 ${products.length} products`);
  console.log(`👤 2 users (admin + test)`);
  console.log(`🎟️  2 promo discounts`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
