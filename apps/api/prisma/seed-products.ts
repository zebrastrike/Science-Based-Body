import { PrismaClient, ProductCategory } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    sku: 'SBB-SEMA',
    name: 'Semaglutide',
    slug: 'semaglutide',
    shortDescription: 'GLP-1 receptor agonist for metabolic research',
    longDescription: `Semaglutide is a GLP-1 receptor agonist peptide for laboratory and metabolic research applications.\n\nThis product is sold strictly for research, laboratory, or analytical purposes. Not for human or veterinary consumption.\n\nEach vial contains lyophilized peptide with verified purity via HPLC analysis. Certificate of Analysis (COA) available for each batch.`,
    category: ProductCategory.RESEARCH_PEPTIDES,
    purityPercent: 99.5,
    molecularWeight: 4113.58,
    basePrice: 72.00,
    compareAtPrice: 99.00,
    isFeatured: true,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-SEMA-2MG', name: '2mg', strength: '2mg', price: 72.00, sortOrder: 0 },
      { sku: 'SBB-SEMA-5MG', name: '5mg', strength: '5mg', price: 99.00, sortOrder: 1 },
      { sku: 'SBB-SEMA-10MG', name: '10mg', strength: '10mg', price: 162.00, sortOrder: 2 },
      { sku: 'SBB-SEMA-15MG', name: '15mg', strength: '15mg', price: 225.00, sortOrder: 3 },
      { sku: 'SBB-SEMA-20MG', name: '20mg', strength: '20mg', price: 283.50, sortOrder: 4 },
      { sku: 'SBB-SEMA-30MG', name: '30mg', strength: '30mg', price: 396.00, sortOrder: 5 },
    ],
  },
  {
    sku: 'SBB-TIRZ',
    name: 'Tirzepatide',
    slug: 'tirzepatide',
    shortDescription: 'Dual GIP/GLP-1 receptor agonist for metabolic research',
    longDescription: `Tirzepatide is a dual glucose-dependent insulinotropic polypeptide (GIP) and GLP-1 receptor agonist peptide for research applications.\n\nThis product is sold strictly for research, laboratory, or analytical purposes. Not for human or veterinary consumption.`,
    category: ProductCategory.RESEARCH_PEPTIDES,
    purityPercent: 99.3,
    molecularWeight: 4813.45,
    basePrice: 90.00,
    compareAtPrice: 126.00,
    isFeatured: true,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-TIRZ-5MG', name: '5mg', strength: '5mg', price: 90.00, sortOrder: 0 },
      { sku: 'SBB-TIRZ-10MG', name: '10mg', strength: '10mg', price: 126.00, sortOrder: 1 },
      { sku: 'SBB-TIRZ-15MG', name: '15mg', strength: '15mg', price: 175.50, sortOrder: 2 },
      { sku: 'SBB-TIRZ-30MG', name: '30mg', strength: '30mg', price: 315.00, sortOrder: 3 },
      { sku: 'SBB-TIRZ-60MG', name: '60mg', strength: '60mg', price: 567.00, sortOrder: 4 },
    ],
  },
  {
    sku: 'SBB-RETA',
    name: 'Retatrutide',
    slug: 'retatrutide',
    shortDescription: 'Triple agonist peptide for metabolic research',
    longDescription: `Retatrutide is a triple GIP/GLP-1/glucagon receptor agonist peptide for laboratory research.\n\nThis product is sold strictly for research, laboratory, or analytical purposes. Not for human or veterinary consumption.`,
    category: ProductCategory.RESEARCH_PEPTIDES,
    purityPercent: 99.2,
    basePrice: 153.00,
    compareAtPrice: 216.00,
    isFeatured: true,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-RETA-5MG', name: '5mg', strength: '5mg', price: 153.00, sortOrder: 0 },
      { sku: 'SBB-RETA-10MG', name: '10mg', strength: '10mg', price: 216.00, sortOrder: 1 },
      { sku: 'SBB-RETA-15MG', name: '15mg', strength: '15mg', price: 301.50, sortOrder: 2 },
    ],
  },
  {
    sku: 'SBB-BPC157',
    name: 'BPC-157',
    slug: 'bpc-157',
    shortDescription: 'Body Protection Compound for recovery research',
    longDescription: `BPC-157 (Body Protection Compound-157) is a pentadecapeptide consisting of 15 amino acids for research applications.\n\nThis product is sold strictly for research, laboratory, or analytical purposes. Not for human or veterinary consumption.\n\nEach vial contains lyophilized peptide with verified purity via HPLC analysis. Certificate of Analysis (COA) available for each batch.`,
    category: ProductCategory.RESEARCH_PEPTIDES,
    purityPercent: 99.5,
    molecularWeight: 1419.53,
    basePrice: 85.50,
    compareAtPrice: 148.50,
    isFeatured: true,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-BPC157-5MG', name: '5mg', strength: '5mg', price: 85.50, sortOrder: 0 },
      { sku: 'SBB-BPC157-10MG', name: '10mg', strength: '10mg', price: 148.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-TB500',
    name: 'TB-500',
    slug: 'tb-500',
    shortDescription: 'Thymosin Beta-4 fragment for recovery research',
    longDescription: `TB-500 is a synthetic fraction of the protein thymosin beta-4 for research applications.\n\nThis product is sold strictly for research, laboratory, or analytical purposes. Not for human or veterinary consumption.\n\nSupplied as lyophilized powder with batch-specific COA.`,
    category: ProductCategory.RESEARCH_PEPTIDES,
    purityPercent: 99.2,
    molecularWeight: 4963.5,
    basePrice: 189.00,
    compareAtPrice: 328.50,
    isFeatured: true,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-TB500-5MG', name: '5mg', strength: '5mg', price: 189.00, sortOrder: 0 },
      { sku: 'SBB-TB500-10MG', name: '10mg', strength: '10mg', price: 328.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-GUT-STACK',
    name: 'Gut Health Stack',
    slug: 'gut-health-stack',
    shortDescription: 'BPC-157 + KPV research combination',
    longDescription: `Gut Health Stack combines BPC-157 and KPV peptides for gastrointestinal research applications.\n\nThis product is sold strictly for research, laboratory, or analytical purposes. Not for human or veterinary consumption.`,
    category: ProductCategory.RESEARCH_COMBINATIONS,
    basePrice: 255.15,
    isFeatured: false,
    weightGrams: 25,
    variants: [
      { sku: 'SBB-GUT-STACK-DEF', name: 'BPC-157 + KPV', strength: 'BPC-157 + KPV', price: 255.15, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-BLOAT-STACK',
    name: 'Bloat Buster Stack',
    slug: 'bloat-buster-stack',
    shortDescription: 'BPC-157 + Retatrutide research combination',
    longDescription: `Bloat Buster Stack combines BPC-157 and Retatrutide peptides for research applications.\n\nThis product is sold strictly for research, laboratory, or analytical purposes. Not for human or veterinary consumption.`,
    category: ProductCategory.RESEARCH_COMBINATIONS,
    basePrice: 328.05,
    isFeatured: false,
    weightGrams: 25,
    variants: [
      { sku: 'SBB-BLOAT-STACK-DEF', name: 'BPC-157 + Retatrutide', strength: 'BPC-157 + Retatrutide', price: 328.05, sortOrder: 0 },
    ],
  },
];

async function main() {
  console.log('Seeding shop products...\n');

  for (const { variants, ...productData } of products) {
    const created = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {
        ...productData,
        isActive: true,
      },
      create: {
        ...productData,
        isActive: true,
        trackInventory: true,
      },
    });

    // Create product-level inventory
    await prisma.inventory.upsert({
      where: { productId: created.id },
      update: {},
      create: {
        productId: created.id,
        quantity: 100,
        lowStockThreshold: 10,
      },
    });

    // Create variants
    if (variants) {
      for (const variant of variants) {
        const createdVariant = await prisma.productVariant.upsert({
          where: { sku: variant.sku },
          update: {
            name: variant.name,
            price: variant.price,
            strength: variant.strength,
            sortOrder: variant.sortOrder,
            isActive: true,
          },
          create: {
            productId: created.id,
            sku: variant.sku,
            name: variant.name,
            price: variant.price,
            strength: variant.strength,
            sortOrder: variant.sortOrder,
            isActive: true,
          },
        });

        // Create variant-level inventory
        await prisma.inventory.upsert({
          where: { variantId: createdVariant.id },
          update: {},
          create: {
            productId: created.id,
            variantId: createdVariant.id,
            quantity: 100,
            lowStockThreshold: 10,
          },
        });
      }
    }

    console.log(`  ✓ ${created.name} (${variants?.length || 0} variants)`);
  }

  console.log(`\nSeeded ${products.length} products with variants`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
