import { PrismaClient } from '@prisma/client';
import { categories, products, batches } from './seed-data/products';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🗑️  Clearing existing data...');
    await prisma.orderItem.deleteMany();
    await prisma.complianceAcknowledgment.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
  }

  // Seed categories
  console.log('📁 Seeding categories...');
  for (const category of categories) {
    await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${categories.length} categories`);

  // Seed products
  console.log('📦 Seeding products...');
  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: { slug: product.categorySlug },
    });

    if (!category) {
      console.warn(`⚠️  Category not found: ${product.categorySlug}`);
      continue;
    }

    const createdProduct = await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        categoryId: category.id,
        shortDescription: product.shortDescription,
        description: product.description,
        basePrice: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        tags: product.tags,
        isFeatured: product.isFeatured,
        isActive: true,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        variants: {
          create: product.variants.map((variant, index) => ({
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            sortOrder: index,
            isActive: true,
          })),
        },
      },
      include: { variants: true },
    });

    // Create inventory for each variant
    for (const variant of createdProduct.variants) {
      const variantData = product.variants.find((v) => v.sku === variant.sku);
      await prisma.inventory.create({
        data: {
          productId: createdProduct.id,
          variantId: variant.id,
          quantity: variantData?.stock || 100,
          lowStockThreshold: 10,
        },
      });
    }
  }
  console.log(`✅ Created ${products.length} products with variants`);

  // Seed batches
  console.log('🧪 Seeding batch/COA data...');
  for (const batch of batches) {
    const product = await prisma.product.findFirst({
      where: { sku: batch.productSku },
    });

    if (!product) {
      console.warn(`⚠️  Product not found: ${batch.productSku}`);
      continue;
    }

    await prisma.batch.create({
      data: {
        batchNumber: batch.batchNumber,
        productId: product.id,
        manufacturedDate: batch.manufacturedDate,
        expirationDate: batch.expirationDate,
        purityPercentage: batch.purity,
        testingLab: batch.testingLab,
        testDate: batch.testDate,
        status: 'APPROVED',
      },
    });
  }
  console.log(`✅ Created ${batches.length} batch records`);

  // Create admin user
  console.log('👤 Creating admin user...');
  const bcrypt = await import('bcrypt');
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

  // Create discount codes
  console.log('🏷️  Creating discount codes...');
  await prisma.discountCode.createMany({
    data: [
      {
        code: 'WELCOME15',
        type: 'PERCENTAGE',
        value: 15,
        minOrderAmount: 50,
        maxUses: 1000,
        usedCount: 0,
        isActive: true,
        expiresAt: new Date('2025-12-31'),
      },
      {
        code: 'RESEARCH20',
        type: 'PERCENTAGE',
        value: 20,
        minOrderAmount: 100,
        maxUses: 500,
        usedCount: 0,
        isActive: true,
        expiresAt: new Date('2025-12-31'),
      },
      {
        code: 'FREESHIP',
        type: 'FREE_SHIPPING',
        value: 0,
        minOrderAmount: 75,
        maxUses: null,
        usedCount: 0,
        isActive: true,
        expiresAt: null,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Discount codes created');

  console.log('\n🎉 Database seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📁 ${categories.length} categories`);
  console.log(`📦 ${products.length} products`);
  console.log(`🧪 ${batches.length} batches`);
  console.log(`👤 1 admin user`);
  console.log(`🏷️  3 discount codes`);
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
