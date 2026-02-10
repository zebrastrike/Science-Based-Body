import { PrismaClient, ProductCategory } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// FULL PRODUCT CATALOG — sourced from SBB_CSV.xlsx
// B2C prices from column G, CPU from column D
// Gray rows = wholesaleOnly, Blue rows = comingSoon
// ============================================================================

interface VariantDef {
  sku: string;
  name: string;
  strength: string;
  price: number;
  costPerUnit: number;
  sortOrder: number;
  wholesaleOnly?: boolean;
}

interface ProductDef {
  sku: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  category: ProductCategory;
  subcategory: string;
  basePrice: number;
  costPerUnit?: number;
  isFeatured?: boolean;
  wholesaleOnly?: boolean;
  comingSoon?: boolean;
  weightGrams?: number;
  purityPercent?: number;
  variants: VariantDef[];
}

const RESEARCH_DISCLAIMER = `\n\nThis product is supplied strictly for research, laboratory, or analytical purposes. Not for human or veterinary use. Each unit contains lyophilized material with verified purity via HPLC analysis. Certificate of Analysis (COA) available for each batch.`;

function desc(text: string): string {
  return text + RESEARCH_DISCLAIMER;
}

// ============================================================================
// INDIVIDUAL PRODUCTS (~62 base products)
// ============================================================================

const products: ProductDef[] = [
  // ---------------------------------------------------------------------------
  // METABOLIC
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-SEMA',
    name: 'Semaglutide',
    slug: 'semaglutide',
    shortDescription: 'GLP-1 receptor agonist for metabolic research',
    longDescription: desc('Semaglutide is a GLP-1 receptor agonist peptide for laboratory and metabolic research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 40.00,
    isFeatured: true,
    weightGrams: 15,
    purityPercent: 99.5,
    variants: [
      { sku: 'SBB-SEMA-2MG', name: '2mg', strength: '2mg', price: 40.00, costPerUnit: 8.00, sortOrder: 0 },
      { sku: 'SBB-SEMA-5MG', name: '5mg', strength: '5mg', price: 50.00, costPerUnit: 9.50, sortOrder: 1 },
      { sku: 'SBB-SEMA-10MG', name: '10mg', strength: '10mg', price: 70.00, costPerUnit: 14.00, sortOrder: 2 },
      { sku: 'SBB-SEMA-15MG', name: '15mg', strength: '15mg', price: 90.00, costPerUnit: 17.50, sortOrder: 3 },
      { sku: 'SBB-SEMA-20MG', name: '20mg', strength: '20mg', price: 110.00, costPerUnit: 21.50, sortOrder: 4 },
      { sku: 'SBB-SEMA-30MG', name: '30mg', strength: '30mg', price: 140.00, costPerUnit: 27.50, sortOrder: 5 },
    ],
  },
  {
    sku: 'SBB-TIRZ',
    name: 'Tirzepatide',
    slug: 'tirzepatide',
    shortDescription: 'Dual GIP/GLP-1 receptor agonist for metabolic research',
    longDescription: desc('Tirzepatide is a dual glucose-dependent insulinotropic polypeptide (GIP) and GLP-1 receptor agonist peptide for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 50.00,
    isFeatured: true,
    weightGrams: 15,
    purityPercent: 99.3,
    variants: [
      { sku: 'SBB-TIRZ-5MG', name: '5mg', strength: '5mg', price: 50.00, costPerUnit: 10.00, sortOrder: 0 },
      { sku: 'SBB-TIRZ-10MG', name: '10mg', strength: '10mg', price: 70.00, costPerUnit: 14.50, sortOrder: 1 },
      { sku: 'SBB-TIRZ-15MG', name: '15mg', strength: '15mg', price: 100.00, costPerUnit: 19.50, sortOrder: 2 },
      { sku: 'SBB-TIRZ-20MG', name: '20mg', strength: '20mg', price: 110.00, costPerUnit: 22.50, sortOrder: 3 },
      { sku: 'SBB-TIRZ-30MG', name: '30mg', strength: '30mg', price: 150.00, costPerUnit: 30.00, sortOrder: 4 },
      { sku: 'SBB-TIRZ-40MG', name: '40mg', strength: '40mg', price: 175.00, costPerUnit: 35.00, sortOrder: 5 },
      { sku: 'SBB-TIRZ-50MG', name: '50mg', strength: '50mg', price: 210.00, costPerUnit: 42.50, sortOrder: 6 },
      { sku: 'SBB-TIRZ-60MG', name: '60mg', strength: '60mg', price: 260.00, costPerUnit: 52.50, sortOrder: 7 },
    ],
  },
  {
    sku: 'SBB-RETA',
    name: 'Retatrutide',
    slug: 'retatrutide',
    shortDescription: 'Triple GIP/GLP-1/glucagon receptor agonist for metabolic research',
    longDescription: desc('Retatrutide is a triple GIP/GLP-1/glucagon receptor agonist peptide for laboratory research.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 250.00,
    isFeatured: true,
    weightGrams: 15,
    purityPercent: 99.2,
    variants: [
      { sku: 'SBB-RETA-5MG', name: '5mg', strength: '5mg', price: 75.00, costPerUnit: 15.00, sortOrder: 0, wholesaleOnly: true },
      { sku: 'SBB-RETA-10MG', name: '10mg', strength: '10mg', price: 250.00, costPerUnit: 24.00, sortOrder: 1 },
      { sku: 'SBB-RETA-15MG', name: '15mg', strength: '15mg', price: 275.00, costPerUnit: 31.50, sortOrder: 2 },
      { sku: 'SBB-RETA-20MG', name: '20mg', strength: '20mg', price: 325.00, costPerUnit: 39.00, sortOrder: 3 },
      { sku: 'SBB-RETA-30MG', name: '30mg', strength: '30mg', price: 350.00, costPerUnit: 52.50, sortOrder: 4 },
      { sku: 'SBB-RETA-40MG', name: '40mg', strength: '40mg', price: 400.00, costPerUnit: 62.00, sortOrder: 5 },
    ],
  },
  {
    sku: 'SBB-CAGRI',
    name: 'Cagrilintide',
    slug: 'cagrilintide',
    shortDescription: 'Amylin analog for metabolic research',
    longDescription: desc('Cagrilintide is a long-acting amylin analog peptide for metabolic research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 145.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-CAGRI-5MG', name: '5mg', strength: '5mg', price: 145.00, costPerUnit: 29.00, sortOrder: 0 },
      { sku: 'SBB-CAGRI-10MG', name: '10mg', strength: '10mg', price: 220.00, costPerUnit: 44.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-CAGRISEMA',
    name: 'Cagrilintide + Semaglutide',
    slug: 'cagrilintide-semaglutide',
    shortDescription: 'Dual amylin/GLP-1 combination for metabolic research',
    longDescription: desc('Cagrilintide + Semaglutide is a dual amylin analog and GLP-1 receptor agonist combination for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 150.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-CAGRISEMA-5MG', name: '5mg', strength: '5mg', price: 150.00, costPerUnit: 30.00, sortOrder: 0 },
      { sku: 'SBB-CAGRISEMA-10MG', name: '10mg', strength: '10mg', price: 260.00, costPerUnit: 52.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-SURVO',
    name: 'Survodutide',
    slug: 'survodutide',
    shortDescription: 'Dual GLP-1/glucagon receptor agonist for metabolic research',
    longDescription: desc('Survodutide is a dual GLP-1/glucagon receptor agonist peptide for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 330.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-SURVO-10MG', name: '10mg', strength: '10mg', price: 330.00, costPerUnit: 66.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-MAZDU',
    name: 'Mazdutide',
    slug: 'mazdutide',
    shortDescription: 'GLP-1/glucagon dual agonist for metabolic research',
    longDescription: desc('Mazdutide is a GLP-1/glucagon dual receptor agonist peptide for metabolic research.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 250.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-MAZDU-10MG', name: '10mg', strength: '10mg', price: 250.00, costPerUnit: 50.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-5A1MQ',
    name: '5-Amino-1MQ',
    slug: '5-amino-1mq',
    shortDescription: 'NNMT inhibitor for metabolic research',
    longDescription: desc('5-Amino-1MQ is an NNMT (nicotinamide N-methyltransferase) inhibitor for metabolic research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 110.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-5A1MQ-5MG', name: '5mg', strength: '5mg', price: 110.00, costPerUnit: 17.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-AOD',
    name: 'AOD-9604',
    slug: 'aod-9604',
    shortDescription: 'HGH fragment for metabolic research',
    longDescription: desc('AOD-9604 is a modified fragment of human growth hormone for metabolic research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 145.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-AOD-5MG', name: '5mg', strength: '5mg', price: 145.00, costPerUnit: 29.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-ADIPO',
    name: 'Adipotide',
    slug: 'adipotide',
    shortDescription: 'Peptidomimetic for metabolic research',
    longDescription: desc('Adipotide is a peptidomimetic compound for metabolic research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 225.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-ADIPO-5MG', name: '5mg', strength: '5mg', price: 225.00, costPerUnit: 45.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-LCAR',
    name: 'L-Carnitine',
    slug: 'l-carnitine',
    shortDescription: 'Amino acid derivative for metabolic research',
    longDescription: desc('L-Carnitine is an amino acid derivative compound for metabolic research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 95.00,
    weightGrams: 20,
    variants: [
      { sku: 'SBB-LCAR-10ML', name: '10ml', strength: '10ml', price: 95.00, costPerUnit: 19.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-LC120',
    name: 'LC120',
    slug: 'lc120',
    shortDescription: 'Metabolic research blend',
    longDescription: desc('LC120 is a proprietary metabolic research blend for laboratory applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 80.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-LC120-DEF', name: 'Standard', strength: 'Standard', price: 80.00, costPerUnit: 16.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-LC216',
    name: 'LC216',
    slug: 'lc216',
    shortDescription: 'Metabolic research blend',
    longDescription: desc('LC216 is a proprietary metabolic research blend for laboratory applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'metabolic',
    basePrice: 80.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-LC216-DEF', name: 'Standard', strength: 'Standard', price: 80.00, costPerUnit: 16.00, sortOrder: 0 },
    ],
  },

  // ---------------------------------------------------------------------------
  // GROWTH HORMONE
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-CJC-NODAC',
    name: 'CJC-1295 (no DAC)',
    slug: 'cjc-1295-no-dac',
    shortDescription: 'GHRH analog without DAC for growth hormone research',
    longDescription: desc('CJC-1295 without Drug Affinity Complex (no DAC) is a growth hormone-releasing hormone analog for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'growth-hormone',
    basePrice: 110.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-CJC-NODAC-5MG', name: '5mg', strength: '5mg', price: 110.00, costPerUnit: 22.00, sortOrder: 0 },
      { sku: 'SBB-CJC-NODAC-10MG', name: '10mg', strength: '10mg', price: 210.00, costPerUnit: 42.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-CJC-DAC',
    name: 'CJC-1295 (with DAC)',
    slug: 'cjc-1295-with-dac',
    shortDescription: 'GHRH analog with DAC for growth hormone research',
    longDescription: desc('CJC-1295 with Drug Affinity Complex (DAC) is a long-acting growth hormone-releasing hormone analog for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'growth-hormone',
    basePrice: 210.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-CJC-DAC-5MG', name: '5mg', strength: '5mg', price: 210.00, costPerUnit: 42.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-CJC-IPA',
    name: 'CJC-1295 + Ipamorelin',
    slug: 'cjc-1295-ipamorelin',
    shortDescription: 'GHRH/GHRP combination for growth hormone research',
    longDescription: desc('CJC-1295 + Ipamorelin is a combined growth hormone-releasing hormone and growth hormone-releasing peptide blend (5mg+5mg) for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'growth-hormone',
    basePrice: 180.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-CJC-IPA-10MG', name: '10mg (5mg+5mg)', strength: '10mg', price: 180.00, costPerUnit: 26.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-IPA',
    name: 'Ipamorelin',
    slug: 'ipamorelin',
    shortDescription: 'Growth hormone-releasing peptide for research',
    longDescription: desc('Ipamorelin is a selective growth hormone secretagogue peptide for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'growth-hormone',
    basePrice: 65.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-IPA-5MG', name: '5mg', strength: '5mg', price: 65.00, costPerUnit: 11.00, sortOrder: 0 },
      { sku: 'SBB-IPA-10MG', name: '10mg', strength: '10mg', price: 110.00, costPerUnit: 19.00, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-SERM',
    name: 'Sermorelin',
    slug: 'sermorelin',
    shortDescription: 'GHRH analog for growth hormone research',
    longDescription: desc('Sermorelin is a growth hormone-releasing hormone analog peptide for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'growth-hormone',
    basePrice: 100.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-SERM-5MG', name: '5mg', strength: '5mg', price: 100.00, costPerUnit: 17.50, sortOrder: 0 },
      { sku: 'SBB-SERM-10MG', name: '10mg', strength: '10mg', price: 140.00, costPerUnit: 27.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-TESA',
    name: 'Tesamorelin',
    slug: 'tesamorelin',
    shortDescription: 'GHRH analog for growth hormone research',
    longDescription: desc('Tesamorelin is a growth hormone-releasing factor analog for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'growth-hormone',
    basePrice: 130.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-TESA-5MG', name: '5mg', strength: '5mg', price: 130.00, costPerUnit: 26.50, sortOrder: 0 },
      { sku: 'SBB-TESA-10MG', name: '10mg', strength: '10mg', price: 200.00, costPerUnit: 50.00, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-HEXA',
    name: 'Hexarelin',
    slug: 'hexarelin',
    shortDescription: 'Growth hormone secretagogue for research',
    longDescription: desc('Hexarelin is a synthetic hexapeptide growth hormone secretagogue for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'growth-hormone',
    basePrice: 140.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-HEXA-5MG', name: '5mg', strength: '5mg', price: 140.00, costPerUnit: 22.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-IGF1',
    name: 'IGF-1 LR3',
    slug: 'igf-1-lr3',
    shortDescription: 'Long-acting IGF-1 analog for growth research',
    longDescription: desc('IGF-1 LR3 is a long-acting analog of insulin-like growth factor 1 for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'growth-hormone',
    basePrice: 65.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-IGF1-01MG', name: '0.1mg', strength: '0.1mg', price: 65.00, costPerUnit: 9.50, sortOrder: 0 },
      { sku: 'SBB-IGF1-1MG', name: '1mg', strength: '1mg', price: 400.00, costPerUnit: 50.50, sortOrder: 1 },
    ],
  },
  // WHOLESALE-ONLY growth hormone products
  {
    sku: 'SBB-GHRP2',
    name: 'GHRP-2',
    slug: 'ghrp-2',
    shortDescription: 'Growth hormone-releasing peptide for research',
    longDescription: desc('GHRP-2 is a synthetic growth hormone-releasing peptide for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'growth-hormone',
    basePrice: 60.00,
    wholesaleOnly: true,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-GHRP2-5MG', name: '5mg', strength: '5mg', price: 60.00, costPerUnit: 12.50, sortOrder: 0 },
      { sku: 'SBB-GHRP2-10MG', name: '10mg', strength: '10mg', price: 110.00, costPerUnit: 19.00, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-GHRP6',
    name: 'GHRP-6',
    slug: 'ghrp-6',
    shortDescription: 'Growth hormone-releasing peptide for research',
    longDescription: desc('GHRP-6 is a synthetic growth hormone-releasing hexapeptide for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'growth-hormone',
    basePrice: 50.00,
    wholesaleOnly: true,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-GHRP6-5MG', name: '5mg', strength: '5mg', price: 50.00, costPerUnit: 10.00, sortOrder: 0 },
      { sku: 'SBB-GHRP6-10MG', name: '10mg', strength: '10mg', price: 60.00, costPerUnit: 12.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-HGH',
    name: 'HGH',
    slug: 'hgh',
    shortDescription: 'Human growth hormone for research',
    longDescription: desc('HGH (Human Growth Hormone) is a recombinant somatotropin for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'growth-hormone',
    basePrice: 70.00,
    wholesaleOnly: true,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-HGH-10IU', name: '10iu', strength: '10iu', price: 70.00, costPerUnit: 14.50, sortOrder: 0 },
      { sku: 'SBB-HGH-15IU', name: '15iu', strength: '15iu', price: 100.00, costPerUnit: 19.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-HGHFRAG',
    name: 'HGH Frag 176-191',
    slug: 'hgh-frag-176-191',
    shortDescription: 'HGH fragment for metabolic research',
    longDescription: desc('HGH Fragment 176-191 is the fat-reducing fragment of human growth hormone for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'growth-hormone',
    basePrice: 140.00,
    wholesaleOnly: true,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-HGHFRAG-5MG', name: '5mg', strength: '5mg', price: 140.00, costPerUnit: 27.50, sortOrder: 0 },
    ],
  },

  // ---------------------------------------------------------------------------
  // RECOVERY
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-BPC157',
    name: 'BPC-157',
    slug: 'bpc-157',
    shortDescription: 'Body Protection Compound for recovery research',
    longDescription: desc('BPC-157 (Body Protection Compound-157) is a pentadecapeptide consisting of 15 amino acids for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'recovery',
    basePrice: 55.00,
    isFeatured: true,
    weightGrams: 15,
    purityPercent: 99.5,
    variants: [
      { sku: 'SBB-BPC157-5MG', name: '5mg', strength: '5mg', price: 55.00, costPerUnit: 11.00, sortOrder: 0 },
      { sku: 'SBB-BPC157-10MG', name: '10mg', strength: '10mg', price: 100.00, costPerUnit: 16.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-TB500',
    name: 'TB-500',
    slug: 'tb-500',
    shortDescription: 'Thymosin Beta-4 fragment for recovery research',
    longDescription: desc('TB-500 is a synthetic fraction of the protein thymosin beta-4 for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'recovery',
    basePrice: 60.00,
    isFeatured: true,
    weightGrams: 15,
    purityPercent: 99.2,
    variants: [
      { sku: 'SBB-TB500-5MG', name: '5mg', strength: '5mg', price: 60.00, costPerUnit: 20.00, sortOrder: 0 },
      { sku: 'SBB-TB500-10MG', name: '10mg', strength: '10mg', price: 100.00, costPerUnit: 36.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-BPCTB',
    name: 'BPC-157 + TB-500',
    slug: 'bpc-157-tb-500',
    shortDescription: 'Recovery peptide combination for research',
    longDescription: desc('BPC-157 + TB-500 is a recovery-focused peptide combination blend for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'recovery',
    basePrice: 125.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-BPCTB-10MG', name: '10mg', strength: '10mg', price: 125.00, costPerUnit: 25.00, sortOrder: 0 },
      { sku: 'SBB-BPCTB-20MG', name: '20mg', strength: '20mg', price: 200.00, costPerUnit: 52.50, sortOrder: 1 },
    ],
  },

  // ---------------------------------------------------------------------------
  // COSMETIC
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-GHKCU',
    name: 'GHK-Cu',
    slug: 'ghk-cu',
    shortDescription: 'Copper peptide for cosmetic research',
    longDescription: desc('GHK-Cu (copper tripeptide-1) is a naturally occurring copper complex for cosmetic and skin research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'cosmetic',
    basePrice: 100.00,
    isFeatured: true,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-GHKCU-50MG', name: '50mg', strength: '50mg', price: 40.00, costPerUnit: 7.50, sortOrder: 0, wholesaleOnly: true },
      { sku: 'SBB-GHKCU-100MG', name: '100mg', strength: '100mg', price: 100.00, costPerUnit: 9.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-SNAP8',
    name: 'SNAP-8',
    slug: 'snap-8',
    shortDescription: 'Octapeptide for cosmetic research',
    longDescription: desc('SNAP-8 (acetyl octapeptide-3) is a neuropeptide for cosmetic research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'cosmetic',
    basePrice: 55.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-SNAP8-10MG', name: '10mg', strength: '10mg', price: 55.00, costPerUnit: 11.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-SNAP8SERUM',
    name: 'SNAP-8 + GHK-Cu Serum',
    slug: 'snap-8-ghk-cu-serum',
    shortDescription: 'Cosmetic peptide serum — Coming Soon',
    longDescription: desc('SNAP-8 + GHK-Cu Serum is a topical cosmetic peptide formulation for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'cosmetic',
    basePrice: 65.00,
    comingSoon: true,
    weightGrams: 50,
    variants: [
      { sku: 'SBB-SNAP8SERUM-30ML', name: '30ml', strength: '30ml', price: 65.00, costPerUnit: 13.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-GLOW',
    name: 'GLOW Blend (BPC+GHK-Cu+TB500)',
    slug: 'glow-blend',
    shortDescription: 'Cosmetic recovery blend for research',
    longDescription: desc('GLOW is a proprietary blend of BPC-157, GHK-Cu, and TB-500 for cosmetic and recovery research.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'cosmetic',
    basePrice: 475.00,
    wholesaleOnly: true,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-GLOW-DEF', name: 'Standard', strength: 'Standard', price: 475.00, costPerUnit: 47.50, sortOrder: 0 },
    ],
  },

  // ---------------------------------------------------------------------------
  // ANTI-INFLAMMATORY
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-KPV',
    name: 'KPV',
    slug: 'kpv',
    shortDescription: 'Anti-inflammatory tripeptide for research',
    longDescription: desc('KPV is a naturally occurring alpha-MSH-derived anti-inflammatory tripeptide for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'anti-inflammatory',
    basePrice: 65.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-KPV-5MG', name: '5mg', strength: '5mg', price: 55.00, costPerUnit: 12.00, sortOrder: 0, wholesaleOnly: true },
      { sku: 'SBB-KPV-10MG', name: '10mg', strength: '10mg', price: 65.00, costPerUnit: 15.00, sortOrder: 1 },
    ],
  },

  // ---------------------------------------------------------------------------
  // ANTIMICROBIAL
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-LL37',
    name: 'LL-37',
    slug: 'll-37',
    shortDescription: 'Antimicrobial peptide for research',
    longDescription: desc('LL-37 is a human cathelicidin antimicrobial peptide for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'antimicrobial',
    basePrice: 110.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-LL37-5MG', name: '5mg', strength: '5mg', price: 110.00, costPerUnit: 22.00, sortOrder: 0 },
    ],
  },

  // ---------------------------------------------------------------------------
  // ANTIOXIDANT
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-GLUT',
    name: 'Glutathione',
    slug: 'glutathione',
    shortDescription: 'Tripeptide antioxidant for research',
    longDescription: desc('Glutathione is a tripeptide antioxidant compound for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'antioxidant',
    basePrice: 110.00,
    weightGrams: 20,
    variants: [
      { sku: 'SBB-GLUT-1500MG', name: '1500mg', strength: '1500mg', price: 110.00, costPerUnit: 19.00, sortOrder: 0 },
    ],
  },

  // ---------------------------------------------------------------------------
  // IMMUNE
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-THYMA',
    name: 'Thymalin',
    slug: 'thymalin',
    shortDescription: 'Thymic peptide for immune research',
    longDescription: desc('Thymalin is a thymic peptide bioregulator for immune system research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'immune',
    basePrice: 85.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-THYMA-10MG', name: '10mg', strength: '10mg', price: 85.00, costPerUnit: 15.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-TA1',
    name: 'Thymosin Alpha-1',
    slug: 'thymosin-alpha-1',
    shortDescription: 'Thymic peptide for immune research',
    longDescription: desc('Thymosin Alpha-1 is a thymic peptide for immune modulation research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'immune',
    basePrice: 110.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-TA1-5MG', name: '5mg', strength: '5mg', price: 110.00, costPerUnit: 22.00, sortOrder: 0 },
      { sku: 'SBB-TA1-10MG', name: '10mg', strength: '10mg', price: 210.00, costPerUnit: 42.00, sortOrder: 1 },
    ],
  },

  // ---------------------------------------------------------------------------
  // LONGEVITY
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-EPITH',
    name: 'Epithalon',
    slug: 'epithalon',
    shortDescription: 'Telomerase activator for longevity research',
    longDescription: desc('Epithalon (Epitalon) is a synthetic tetrapeptide telomerase activator for longevity research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'longevity',
    basePrice: 60.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-EPITH-10MG', name: '10mg', strength: '10mg', price: 60.00, costPerUnit: 12.00, sortOrder: 0 },
      { sku: 'SBB-EPITH-50MG', name: '50mg', strength: '50mg', price: 175.00, costPerUnit: 35.00, sortOrder: 1, wholesaleOnly: true },
    ],
  },

  // ---------------------------------------------------------------------------
  // MITOCHONDRIAL
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-MOTSC',
    name: 'MOTS-c',
    slug: 'mots-c',
    shortDescription: 'Mitochondrial-derived peptide for research',
    longDescription: desc('MOTS-c is a mitochondrial-derived peptide for metabolic and exercise research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'mitochondrial',
    basePrice: 100.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-MOTSC-10MG', name: '10mg', strength: '10mg', price: 100.00, costPerUnit: 17.00, sortOrder: 0 },
      { sku: 'SBB-MOTSC-40MG', name: '40mg', strength: '40mg', price: 250.00, costPerUnit: 50.00, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-NAD',
    name: 'NAD+',
    slug: 'nad-plus',
    shortDescription: 'Nicotinamide adenine dinucleotide for research',
    longDescription: desc('NAD+ (Nicotinamide Adenine Dinucleotide) is a coenzyme for mitochondrial and longevity research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'mitochondrial',
    basePrice: 140.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-NAD-100MG', name: '100mg', strength: '100mg', price: 45.00, costPerUnit: 8.80, sortOrder: 0, wholesaleOnly: true },
      { sku: 'SBB-NAD-500MG', name: '500mg', strength: '500mg', price: 140.00, costPerUnit: 20.00, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-SLUPP',
    name: 'SLU-PP-332',
    slug: 'slu-pp-332',
    shortDescription: 'ERR agonist for mitochondrial research',
    longDescription: desc('SLU-PP-332 is an estrogen-related receptor (ERR) agonist for mitochondrial and exercise mimetic research.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'mitochondrial',
    basePrice: 165.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-SLUPP-5MG', name: '5mg', strength: '5mg', price: 165.00, costPerUnit: 33.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-SS31',
    name: 'SS-31',
    slug: 'ss-31',
    shortDescription: 'Mitochondria-targeted peptide for research',
    longDescription: desc('SS-31 (Elamipretide) is a mitochondria-targeted peptide for cellular energy research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'mitochondrial',
    basePrice: 120.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-SS31-10MG', name: '10mg', strength: '10mg', price: 120.00, costPerUnit: 24.00, sortOrder: 0 },
      { sku: 'SBB-SS31-50MG', name: '50mg', strength: '50mg', price: 500.00, costPerUnit: 100.00, sortOrder: 1 },
    ],
  },

  // ---------------------------------------------------------------------------
  // NOOTROPIC
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-SELANK',
    name: 'Selank',
    slug: 'selank',
    shortDescription: 'Anxiolytic peptide for nootropic research',
    longDescription: desc('Selank is a synthetic analog of immunomodulatory peptide tuftsin for nootropic research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'nootropic',
    basePrice: 50.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-SELANK-5MG', name: '5mg', strength: '5mg', price: 50.00, costPerUnit: 9.50, sortOrder: 0 },
      { sku: 'SBB-SELANK-10MG', name: '10mg', strength: '10mg', price: 75.00, costPerUnit: 15.00, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-SEMAX',
    name: 'Semax',
    slug: 'semax',
    shortDescription: 'Nootropic peptide for cognitive research',
    longDescription: desc('Semax is a synthetic peptide analog of ACTH(4-10) for cognitive and nootropic research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'nootropic',
    basePrice: 50.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-SEMAX-5MG', name: '5mg', strength: '5mg', price: 50.00, costPerUnit: 9.50, sortOrder: 0 },
      { sku: 'SBB-SEMAX-10MG', name: '10mg', strength: '10mg', price: 70.00, costPerUnit: 14.00, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-DIHEXA',
    name: 'Dihexa',
    slug: 'dihexa',
    shortDescription: 'Nootropic hexapeptide for cognitive research',
    longDescription: desc('Dihexa is an oligopeptide derived from angiotensin IV for cognitive and neurotrophic research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'nootropic',
    basePrice: 100.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-DIHEXA-5MG', name: '5mg', strength: '5mg', price: 100.00, costPerUnit: 20.00, sortOrder: 0 },
      { sku: 'SBB-DIHEXA-10MG', name: '10mg', strength: '10mg', price: 160.00, costPerUnit: 31.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-PINEALON',
    name: 'Pinealon',
    slug: 'pinealon',
    shortDescription: 'Tripeptide bioregulator for nootropic research',
    longDescription: desc('Pinealon is a synthetic tripeptide bioregulator for nootropic and longevity research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'nootropic',
    basePrice: 60.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-PINEALON-5MG', name: '5mg', strength: '5mg', price: 60.00, costPerUnit: 12.50, sortOrder: 0 },
      { sku: 'SBB-PINEALON-10MG', name: '10mg', strength: '10mg', price: 90.00, costPerUnit: 17.50, sortOrder: 1 },
      { sku: 'SBB-PINEALON-20MG', name: '20mg', strength: '20mg', price: 120.00, costPerUnit: 24.00, sortOrder: 2 },
    ],
  },
  {
    sku: 'SBB-CEREBRO',
    name: 'Cerebrolysin',
    slug: 'cerebrolysin',
    shortDescription: 'Neuropeptide preparation for cognitive research',
    longDescription: desc('Cerebrolysin is a neuropeptide preparation consisting of low-molecular-weight peptides for cognitive research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'nootropic',
    basePrice: 70.00,
    weightGrams: 30,
    variants: [
      { sku: 'SBB-CEREBRO-60MG', name: '60mg (6 vials)', strength: '60mg', price: 70.00, costPerUnit: 10.70, sortOrder: 0 },
    ],
  },

  // ---------------------------------------------------------------------------
  // NEUROPEPTIDE
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-VIP',
    name: 'VIP',
    slug: 'vip',
    shortDescription: 'Vasoactive intestinal peptide for research',
    longDescription: desc('VIP (Vasoactive Intestinal Peptide) is a neuropeptide for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'neuropeptide',
    basePrice: 100.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-VIP-5MG', name: '5mg', strength: '5mg', price: 100.00, costPerUnit: 20.50, sortOrder: 0 },
      { sku: 'SBB-VIP-10MG', name: '10mg', strength: '10mg', price: 180.00, costPerUnit: 36.50, sortOrder: 1 },
    ],
  },

  // ---------------------------------------------------------------------------
  // NEUROPROTECTIVE
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-ARA290',
    name: 'ARA-290',
    slug: 'ara-290',
    shortDescription: 'EPO-derived peptide for neuroprotective research',
    longDescription: desc('ARA-290 is a non-hematopoietic erythropoietin-derived peptide for neuroprotective research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'neuroprotective',
    basePrice: 80.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-ARA290-10MG', name: '10mg', strength: '10mg', price: 80.00, costPerUnit: 16.50, sortOrder: 0 },
    ],
  },

  // ---------------------------------------------------------------------------
  // HORMONE
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-OXY',
    name: 'Oxytocin',
    slug: 'oxytocin',
    shortDescription: 'Neuropeptide hormone for research',
    longDescription: desc('Oxytocin is a neuropeptide hormone for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'hormone',
    basePrice: 65.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-OXY-2MG', name: '2mg', strength: '2mg', price: 65.00, costPerUnit: 10.00, sortOrder: 0 },
    ],
  },

  // ---------------------------------------------------------------------------
  // REPRODUCTIVE
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-HMG',
    name: 'HMG',
    slug: 'hmg',
    shortDescription: 'Human menopausal gonadotropin for reproductive research',
    longDescription: desc('HMG (Human Menopausal Gonadotropin) is a gonadotropin for reproductive research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'reproductive',
    basePrice: 90.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-HMG-75IU', name: '75iu', strength: '75iu', price: 90.00, costPerUnit: 17.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-KISS10',
    name: 'Kisspeptin-10',
    slug: 'kisspeptin-10',
    shortDescription: 'Reproductive peptide for research',
    longDescription: desc('Kisspeptin-10 is a GnRH-stimulating peptide for reproductive research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'reproductive',
    basePrice: 80.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-KISS10-5MG', name: '5mg', strength: '5mg', price: 80.00, costPerUnit: 16.50, sortOrder: 0 },
      { sku: 'SBB-KISS10-10MG', name: '10mg', strength: '10mg', price: 140.00, costPerUnit: 27.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-HCG',
    name: 'hCG',
    slug: 'hcg',
    shortDescription: 'Human chorionic gonadotropin for reproductive research',
    longDescription: desc('hCG (Human Chorionic Gonadotropin) is a gonadotropin hormone for reproductive research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'reproductive',
    basePrice: 100.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-HCG-5000IU', name: '5000 IU', strength: '5000IU', price: 100.00, costPerUnit: 20.50, sortOrder: 0 },
      { sku: 'SBB-HCG-10000IU', name: '10000 IU', strength: '10000IU', price: 180.00, costPerUnit: 40.00, sortOrder: 1 },
    ],
  },

  // ---------------------------------------------------------------------------
  // SEXUAL HEALTH
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-PT141',
    name: 'PT-141',
    slug: 'pt-141',
    shortDescription: 'Melanocortin receptor agonist for research',
    longDescription: desc('PT-141 (Bremelanotide) is a melanocortin receptor agonist peptide for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'sexual-health',
    basePrice: 90.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-PT141-10MG', name: '10mg', strength: '10mg', price: 90.00, costPerUnit: 17.50, sortOrder: 0 },
    ],
  },

  // ---------------------------------------------------------------------------
  // SLEEP
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-DSIP',
    name: 'DSIP',
    slug: 'dsip',
    shortDescription: 'Delta sleep-inducing peptide for research',
    longDescription: desc('DSIP (Delta Sleep-Inducing Peptide) is a neuropeptide for sleep and circadian research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'sleep',
    basePrice: 55.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-DSIP-5MG', name: '5mg', strength: '5mg', price: 55.00, costPerUnit: 11.00, sortOrder: 0 },
      { sku: 'SBB-DSIP-15MG', name: '15mg', strength: '15mg', price: 120.00, costPerUnit: 24.00, sortOrder: 1 },
    ],
  },

  // ---------------------------------------------------------------------------
  // TANNING
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-MT1',
    name: 'Melanotan-1',
    slug: 'melanotan-1',
    shortDescription: 'Melanocortin receptor agonist for tanning research',
    longDescription: desc('Melanotan-1 (Afamelanotide) is a synthetic alpha-melanocyte-stimulating hormone analog for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'tanning',
    basePrice: 75.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-MT1-10MG', name: '10mg', strength: '10mg', price: 75.00, costPerUnit: 12.50, sortOrder: 0 },
    ],
  },

  // ---------------------------------------------------------------------------
  // RESEARCH / OPIOID
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-DERM',
    name: 'Dermorphin',
    slug: 'dermorphin',
    shortDescription: 'Opioid peptide for research',
    longDescription: desc('Dermorphin is a naturally occurring opioid heptapeptide for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'research',
    basePrice: 70.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-DERM-5MG', name: '5mg', strength: '5mg', price: 70.00, costPerUnit: 14.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-PNC27',
    name: 'PNC-27',
    slug: 'pnc-27',
    shortDescription: 'Anti-neoplastic peptide for research',
    longDescription: desc('PNC-27 is a synthetic anti-neoplastic peptide for research applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'research',
    basePrice: 125.00,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-PNC27-5MG', name: '5mg', strength: '5mg', price: 125.00, costPerUnit: 25.00, sortOrder: 0 },
      { sku: 'SBB-PNC27-10MG', name: '10mg', strength: '10mg', price: 210.00, costPerUnit: 41.50, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-KLOW80',
    name: 'KLOW80 Blend',
    slug: 'klow80-blend',
    shortDescription: 'Proprietary research blend',
    longDescription: desc('KLOW80 is a proprietary research blend for laboratory applications.'),
    category: ProductCategory.RESEARCH_PEPTIDES,
    subcategory: 'research',
    basePrice: 300.00,
    wholesaleOnly: true,
    weightGrams: 15,
    variants: [
      { sku: 'SBB-KLOW80-80MG', name: '80mg', strength: '80mg', price: 300.00, costPerUnit: 60.00, sortOrder: 0 },
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPPLIES
  // ---------------------------------------------------------------------------
  {
    sku: 'SBB-BACW',
    name: 'BAC Water',
    slug: 'bac-water',
    shortDescription: 'Bacteriostatic water for reconstitution',
    longDescription: desc('Bacteriostatic Water (BAC Water) is sterile water containing 0.9% benzyl alcohol for reconstitution of lyophilized compounds.'),
    category: ProductCategory.MATERIALS_SUPPLIES,
    subcategory: 'supplies',
    basePrice: 5.00,
    weightGrams: 20,
    variants: [
      { sku: 'SBB-BACW-3ML', name: '3ml', strength: '3ml', price: 5.00, costPerUnit: 1.30, sortOrder: 0 },
      { sku: 'SBB-BACW-10ML', name: '10ml', strength: '10ml', price: 10.00, costPerUnit: 1.80, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-STERW',
    name: 'Sterile Water',
    slug: 'sterile-water',
    shortDescription: 'Sterile water for injection',
    longDescription: desc('Sterile Water for Injection (SWFI) is purified water for reconstitution of lyophilized compounds.'),
    category: ProductCategory.MATERIALS_SUPPLIES,
    subcategory: 'supplies',
    basePrice: 5.00,
    weightGrams: 20,
    variants: [
      { sku: 'SBB-STERW-3ML', name: '3ml', strength: '3ml', price: 5.00, costPerUnit: 1.30, sortOrder: 0 },
      { sku: 'SBB-STERW-10ML', name: '10ml', strength: '10ml', price: 10.00, costPerUnit: 1.80, sortOrder: 1 },
    ],
  },
  {
    sku: 'SBB-ACET',
    name: 'Acetic Acid',
    slug: 'acetic-acid',
    shortDescription: 'Acetic acid for reconstitution',
    longDescription: desc('Acetic Acid solution is used for reconstitution of specific lyophilized peptides that require acidic solvents.'),
    category: ProductCategory.MATERIALS_SUPPLIES,
    subcategory: 'supplies',
    basePrice: 10.00,
    weightGrams: 20,
    variants: [
      { sku: 'SBB-ACET-3ML', name: '3ml', strength: '3ml', price: 10.00, costPerUnit: 1.50, sortOrder: 0 },
      { sku: 'SBB-ACET-10ML', name: '10ml', strength: '10ml', price: 10.00, costPerUnit: 2.00, sortOrder: 1 },
    ],
  },
];

// ============================================================================
// PRE-MADE STACKS (18 stacks from CSV)
// ============================================================================

const stacks: ProductDef[] = [
  {
    sku: 'SBB-STK-GUT',
    name: 'Gut Health Stack',
    slug: 'gut-health-stack',
    shortDescription: 'BPC-157 10mg + KPV 10mg research combination',
    longDescription: desc('Gut Health Stack combines BPC-157 10mg and KPV 10mg peptides for gastrointestinal research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 150.00,
    costPerUnit: 31.50,
    weightGrams: 25,
    variants: [
      { sku: 'SBB-STK-GUT-DEF', name: 'BPC-157 10mg + KPV 10mg', strength: 'Standard', price: 150.00, costPerUnit: 31.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-BLOAT',
    name: 'Bloat Buster Stack',
    slug: 'bloat-buster-stack',
    shortDescription: 'BPC-157 10mg + Retatrutide 10mg research combination',
    longDescription: desc('Bloat Buster Stack combines BPC-157 10mg and Retatrutide 10mg peptides for research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 305.00,
    costPerUnit: 40.50,
    weightGrams: 25,
    variants: [
      { sku: 'SBB-STK-BLOAT-DEF', name: 'BPC-157 10mg + Retatrutide 10mg', strength: 'Standard', price: 305.00, costPerUnit: 40.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-BELLY',
    name: 'Belly Buster Stack',
    slug: 'belly-buster-stack',
    shortDescription: 'Retatrutide 10mg + Tesamorelin 10mg + BPC-157 10mg',
    longDescription: desc('Belly Buster Stack combines Retatrutide, Tesamorelin, and BPC-157 for metabolic research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 455.00,
    costPerUnit: 90.50,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-BELLY-DEF', name: 'Retatrutide + Tesamorelin + BPC-157', strength: 'Standard', price: 455.00, costPerUnit: 90.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-WLOSS',
    name: 'Weight Loss Stack',
    slug: 'weight-loss-stack',
    shortDescription: 'Retatrutide 10mg + NAD 500mg + GHK-Cu 100mg',
    longDescription: desc('Weight Loss Stack combines Retatrutide, NAD+, and GHK-Cu for metabolic research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 345.00,
    costPerUnit: 42.30,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-WLOSS-DEF', name: 'Retatrutide + NAD+ + GHK-Cu', strength: 'Standard', price: 345.00, costPerUnit: 42.30, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-BAYWATCH',
    name: 'Baywatch Stack',
    slug: 'baywatch-stack',
    shortDescription: 'Retatrutide 10mg + Melanotan-1 10mg + BPC-157 10mg',
    longDescription: desc('Baywatch Stack combines Retatrutide, Melanotan-1, and BPC-157 for metabolic and tanning research.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 400.00,
    costPerUnit: 53.00,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-BAYWATCH-DEF', name: 'Retatrutide + Melanotan-1 + BPC-157', strength: 'Standard', price: 400.00, costPerUnit: 53.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-HEAL',
    name: 'Healing Stack',
    slug: 'healing-stack',
    shortDescription: 'BPC-157 10mg + TB500 10mg + KPV 10mg',
    longDescription: desc('Healing Stack combines BPC-157, TB-500, and KPV for recovery research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 240.00,
    costPerUnit: 68.00,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-HEAL-DEF', name: 'BPC-157 + TB-500 + KPV', strength: 'Standard', price: 240.00, costPerUnit: 68.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-RECOV',
    name: 'Recovery Stack',
    slug: 'recovery-stack',
    shortDescription: 'BPC-157 10mg + TB500 10mg + GHK-Cu 100mg',
    longDescription: desc('Recovery Stack combines BPC-157, TB-500, and GHK-Cu for recovery research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 270.00,
    costPerUnit: 62.50,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-RECOV-DEF', name: 'BPC-157 + TB-500 + GHK-Cu', strength: 'Standard', price: 270.00, costPerUnit: 62.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-ANTIAGE',
    name: 'Anti-Aging Stack',
    slug: 'anti-aging-stack',
    shortDescription: 'Epithalon 50mg + NAD 500mg + GHK-Cu 100mg',
    longDescription: desc('Anti-Aging Stack combines Epithalon, NAD+, and GHK-Cu for longevity research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 285.00,
    costPerUnit: 30.30,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-ANTIAGE-DEF', name: 'Epithalon + NAD+ + GHK-Cu', strength: 'Standard', price: 285.00, costPerUnit: 30.30, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-LONGEV',
    name: 'Longevity Research Stack',
    slug: 'longevity-research-stack',
    shortDescription: 'Epithalon 50mg + NAD 500mg + SS-31 10mg',
    longDescription: desc('Longevity Research Stack combines Epithalon, NAD+, and SS-31 for longevity research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 250.00,
    costPerUnit: 44.80,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-LONGEV-DEF', name: 'Epithalon + NAD+ + SS-31', strength: 'Standard', price: 250.00, costPerUnit: 44.80, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-GROWTH',
    name: 'Growth Stack',
    slug: 'growth-stack',
    shortDescription: 'CJC-1295 5mg + Ipamorelin 10mg + NAD+ 500mg',
    longDescription: desc('Growth Stack combines CJC-1295, Ipamorelin, and NAD+ for growth hormone research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 300.00,
    costPerUnit: 41.80,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-GROWTH-DEF', name: 'CJC-1295 + Ipamorelin + NAD+', strength: 'Standard', price: 300.00, costPerUnit: 41.80, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-COGN',
    name: 'Cognitive Stack',
    slug: 'cognitive-stack',
    shortDescription: 'Semax 10mg + Selank 10mg + Pinealon 10mg',
    longDescription: desc('Cognitive Stack combines Semax, Selank, and Pinealon for nootropic research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 200.00,
    costPerUnit: 31.50,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-COGN-DEF', name: 'Semax + Selank + Pinealon', strength: 'Standard', price: 200.00, costPerUnit: 31.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-MENTAL',
    name: 'Mental Wellness Stack',
    slug: 'mental-wellness-stack',
    shortDescription: 'Semax 10mg + Selank 10mg + DSIP 15mg',
    longDescription: desc('Mental Wellness Stack combines Semax, Selank, and DSIP for nootropic and sleep research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 250.00,
    costPerUnit: 30.00,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-MENTAL-DEF', name: 'Semax + Selank + DSIP', strength: 'Standard', price: 250.00, costPerUnit: 30.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-SLEEP',
    name: 'Sleep Stack',
    slug: 'sleep-stack',
    shortDescription: 'DSIP 15mg + Pinealon 10mg + Epithalon 10mg',
    longDescription: desc('Sleep Stack combines DSIP, Pinealon, and Epithalon for sleep and longevity research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 160.00,
    costPerUnit: 35.50,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-SLEEP-DEF', name: 'DSIP + Pinealon + Epithalon', strength: 'Standard', price: 160.00, costPerUnit: 35.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-SKINHR',
    name: 'Skin + Hair Radiance Stack',
    slug: 'skin-hair-radiance-stack',
    shortDescription: 'GHK-Cu + SNAP-8 Serum + KPV',
    longDescription: desc('Skin + Hair Radiance Stack combines GHK-Cu, SNAP-8 Serum, and KPV for cosmetic research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 205.00,
    costPerUnit: 37.50,
    wholesaleOnly: true,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-SKINHR-DEF', name: 'GHK-Cu + SNAP-8 Serum + KPV', strength: 'Standard', price: 205.00, costPerUnit: 37.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-GLOWSTK',
    name: 'Glow Stack',
    slug: 'glow-stack',
    shortDescription: 'GHK-Cu 100mg + TB500 10mg + BPC-157 10mg',
    longDescription: desc('Glow Stack combines GHK-Cu, TB-500, and BPC-157 for cosmetic and recovery research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 300.00,
    costPerUnit: 62.50,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-GLOWSTK-DEF', name: 'GHK-Cu + TB-500 + BPC-157', strength: 'Standard', price: 300.00, costPerUnit: 62.50, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-IMMUNE',
    name: 'Immune Support Stack',
    slug: 'immune-support-stack',
    shortDescription: 'Thymosin Alpha-1 10mg + Thymalin 10mg + KPV 10mg',
    longDescription: desc('Immune Support Stack combines Thymosin Alpha-1, Thymalin, and KPV for immune research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 360.00,
    costPerUnit: 52.00,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-IMMUNE-DEF', name: 'Thymosin Alpha-1 + Thymalin + KPV', strength: 'Standard', price: 360.00, costPerUnit: 52.00, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-ENERGY',
    name: 'Energy Stack',
    slug: 'energy-stack',
    shortDescription: 'MOTS-c 10mg + SS-31 10mg + NAD+ 500mg',
    longDescription: desc('Energy Stack combines MOTS-c, SS-31, and NAD+ for mitochondrial energy research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 340.00,
    costPerUnit: 49.80,
    weightGrams: 35,
    variants: [
      { sku: 'SBB-STK-ENERGY-DEF', name: 'MOTS-c + SS-31 + NAD+', strength: 'Standard', price: 340.00, costPerUnit: 49.80, sortOrder: 0 },
    ],
  },
  {
    sku: 'SBB-STK-RECOMP',
    name: 'Body Recomp Stack',
    slug: 'body-recomp-stack',
    shortDescription: 'Retatrutide 10mg + CJC w/DAC 5mg (2) + Ipamorelin 5mg (2)',
    longDescription: desc('Body Recomp Stack combines Retatrutide, CJC-1295 with DAC, and Ipamorelin for metabolic and growth research applications.'),
    category: ProductCategory.RESEARCH_COMBINATIONS,
    subcategory: 'stacks',
    basePrice: 554.00,
    costPerUnit: 132.00,
    weightGrams: 45,
    variants: [
      { sku: 'SBB-STK-RECOMP-DEF', name: 'Retatrutide + CJC w/DAC + Ipamorelin', strength: 'Standard', price: 554.00, costPerUnit: 132.00, sortOrder: 0 },
    ],
  },
];

// ============================================================================
// SEED EXECUTION
// ============================================================================

async function main() {
  console.log('Seeding full product catalog...\n');

  // Delete existing products (clean slate for re-seed)
  console.log('  Clearing existing product data...');
  await prisma.inventory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productBatch.deleteMany({});
  await prisma.priceListItem.deleteMany({});
  await prisma.stockNotification.deleteMany({});
  await prisma.product.deleteMany({});
  console.log('  Done.\n');

  const allProducts = [...products, ...stacks];

  for (const { variants, costPerUnit: prodCpu, ...productData } of allProducts) {
    const created = await prisma.product.create({
      data: {
        ...productData,
        costPerUnit: prodCpu,
        isActive: true,
        trackInventory: true,
      },
    });

    // Create product-level inventory
    await prisma.inventory.create({
      data: {
        productId: created.id,
        quantity: 0,
        lowStockThreshold: 10,
      },
    });

    // Create variants
    for (const variant of variants) {
      const { costPerUnit: varCpu, wholesaleOnly: varWholesale, ...variantData } = variant;
      const createdVariant = await prisma.productVariant.create({
        data: {
          productId: created.id,
          ...variantData,
          costPerUnit: varCpu,
          wholesaleOnly: varWholesale || false,
          isActive: true,
        },
      });

      // Create variant-level inventory
      await prisma.inventory.create({
        data: {
          variantId: createdVariant.id,
          quantity: 0,
          lowStockThreshold: 10,
        },
      });
    }

    const flags = [
      productData.wholesaleOnly ? 'WHOLESALE' : '',
      productData.comingSoon ? 'COMING SOON' : '',
    ].filter(Boolean).join(', ');
    const flagStr = flags ? ` [${flags}]` : '';
    console.log(`  + ${created.name} (${variants.length} variant${variants.length !== 1 ? 's' : ''})${flagStr}`);
  }

  console.log(`\nSeeded ${allProducts.length} products (${products.length} individual + ${stacks.length} stacks)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
