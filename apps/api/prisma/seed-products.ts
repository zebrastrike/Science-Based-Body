import { PrismaClient, ProductCategory } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    sku: 'SBB-BPC157-5MG',
    name: 'BPC-157 Research Peptide',
    slug: 'bpc-157-research-peptide',
    shortDescription: 'High-purity BPC-157 peptide for research applications',
    longDescription: `BPC-157 (Body Protection Compound-157) is a pentadecapeptide consisting of 15 amino acids. This research-grade peptide is synthesized for laboratory and analytical purposes only.

This product is sold strictly for research, laboratory, or analytical purposes. Not for human or veterinary consumption.

Each vial contains lyophilized peptide with verified purity via HPLC analysis. Certificate of Analysis (COA) available for each batch.`,
    category: ProductCategory.RESEARCH_PEPTIDES,
    purityPercent: 99.5,
    molecularWeight: 1419.53,
    basePrice: 49.99,
    compareAtPrice: 69.99,
    isFeatured: true,
  },
  {
    sku: 'SBB-TB500-5MG',
    name: 'TB-500 Research Peptide',
    slug: 'tb-500-research-peptide',
    shortDescription: 'High-purity Thymosin Beta-4 fragment for research',
    longDescription: `TB-500 is a synthetic fraction of the protein thymosin beta-4. This research-grade peptide is produced for laboratory and analytical applications only.

This product is sold strictly for research, laboratory, or analytical purposes. Not for human or veterinary consumption.

Supplied as lyophilized powder with batch-specific COA.`,
    category: ProductCategory.RESEARCH_PEPTIDES,
    purityPercent: 99.2,
    molecularWeight: 4963.5,
    basePrice: 59.99,
    isFeatured: true,
  },
  {
    sku: 'SBB-GHK-CU-50MG',
    name: 'GHK-Cu Research Compound',
    slug: 'ghk-cu-research-compound',
    shortDescription: 'Copper peptide complex for laboratory research',
    longDescription: `GHK-Cu (glycyl-L-histidyl-L-lysine copper complex) is a naturally occurring copper complex. This research-grade compound is intended for laboratory study only.

This product is sold strictly for research, laboratory, or analytical purposes. Not for human or veterinary consumption.`,
    category: ProductCategory.RESEARCH_PEPTIDES,
    purityPercent: 98.5,
    basePrice: 39.99,
    isFeatured: false,
  },
  {
    sku: 'SBB-NAD-500MG',
    name: 'NAD+ Reference Standard',
    slug: 'nad-reference-standard',
    shortDescription: 'Analytical reference standard for laboratory calibration',
    longDescription: `Nicotinamide adenine dinucleotide (NAD+) analytical reference standard for laboratory calibration and research purposes.

This product is sold strictly for research, laboratory, or analytical purposes. Not for human or veterinary consumption.`,
    category: ProductCategory.ANALYTICAL_REFERENCE_MATERIALS,
    purityPercent: 99.9,
    basePrice: 89.99,
    isFeatured: false,
  },
];

async function main() {
  console.log('Seeding products...');

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: {
        ...product,
        isActive: true,
        trackInventory: true,
      },
    });

    // Create inventory record
    await prisma.inventory.upsert({
      where: { productId: created.id },
      update: {},
      create: {
        productId: created.id,
        quantity: 100,
        lowStockThreshold: 10,
      },
    });

    console.log(`Product created/updated: ${created.name}`);
  }

  console.log('');
  console.log(`Seeded ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
