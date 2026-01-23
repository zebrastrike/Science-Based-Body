// Science Based Body - Product Catalog Seed Data
// Complete 28-product catalog with pricing (same supplier as MahaPeps)
// Premium Research Peptides - American Made, Third-Party Tested

export interface ProductSeedData {
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  variants: ProductVariant[];
  tags?: string[];
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface ProductVariant {
  name: string;
  sku: string;
  strengthValue: number;
  strengthUnit: string;
  price: number;
  priceCents: number;
  stock: number;
}

// ============================================================================
// CATEGORIES
// ============================================================================

export const categories = [
  {
    name: 'Metabolic Peptides',
    slug: 'metabolic-peptides',
    description: 'GLP-1 agonists and metabolic research compounds for weight management studies',
    sortOrder: 1,
  },
  {
    name: 'Recovery Peptides',
    slug: 'recovery-peptides',
    description: 'Tissue healing and regeneration research peptides',
    sortOrder: 2,
  },
  {
    name: 'Growth Hormone',
    slug: 'growth-hormone',
    description: 'GHRH analogs and GH secretagogues for research',
    sortOrder: 3,
  },
  {
    name: 'Nootropic Peptides',
    slug: 'nootropic-peptides',
    description: 'Cognitive enhancement and neuroprotective research compounds',
    sortOrder: 4,
  },
  {
    name: 'Longevity Peptides',
    slug: 'longevity-peptides',
    description: 'Anti-aging and cellular health research peptides',
    sortOrder: 5,
  },
  {
    name: 'Peptide Blends',
    slug: 'peptide-blends',
    description: 'Synergistic peptide combinations for enhanced research',
    sortOrder: 6,
  },
  {
    name: 'Specialty Peptides',
    slug: 'specialty-peptides',
    description: 'Specialized research compounds for specific applications',
    sortOrder: 7,
  },
];

// ============================================================================
// COMPLETE PRODUCT CATALOG - 28 Products
// ============================================================================

export const products: ProductSeedData[] = [
  // --------------------------------------------------------------------------
  // METABOLIC PEPTIDES
  // --------------------------------------------------------------------------
  {
    name: 'Semaglutide',
    slug: 'semaglutide',
    sku: 'SBB-SEMA-BASE',
    categorySlug: 'metabolic-peptides',
    shortDescription: 'GLP-1 receptor agonist for metabolic research',
    description: `Semaglutide is a glucagon-like peptide-1 (GLP-1) receptor agonist extensively studied for insulin secretion and appetite regulation mechanisms.

**Research Applications:**
- Metabolic pathway studies
- Glucose homeostasis research
- Appetite regulation mechanisms
- Pancreatic beta-cell function studies

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder
- Storage: -20°C recommended
- Reconstitution: Bacteriostatic water

Third-party tested with Certificate of Analysis included.`,
    basePrice: 130.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-SEMA-10MG', strengthValue: 10, strengthUnit: 'MG', price: 130.00, priceCents: 13000, stock: 100 },
    ],
    tags: ['bestseller', 'glp-1', 'metabolic'],
    isFeatured: true,
    metaTitle: 'Semaglutide 10mg | 99%+ Purity | Science Based Body',
    metaDescription: 'Premium semaglutide peptide for research. Third-party tested, 99%+ purity verified. Same-day shipping.',
  },
  {
    name: 'Retatrutide',
    slug: 'retatrutide',
    sku: 'SBB-RETA-BASE',
    categorySlug: 'metabolic-peptides',
    shortDescription: 'Triple agonist for metabolic pathway research',
    description: `Retatrutide is a novel triple agonist targeting GIP, GLP-1, and glucagon receptors, representing cutting-edge metabolic research.

**Research Applications:**
- Triple receptor pathway studies
- Advanced metabolic research
- Energy expenditure mechanisms
- Glucagon receptor research

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder
- Storage: -20°C recommended`,
    basePrice: 129.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-RETA-10MG', strengthValue: 10, strengthUnit: 'MG', price: 129.00, priceCents: 12900, stock: 100 },
    ],
    tags: ['new', 'triple-agonist', 'metabolic'],
    isFeatured: true,
    metaTitle: 'Retatrutide 10mg | Triple Agonist | Science Based Body',
    metaDescription: 'Retatrutide triple agonist peptide for research. GIP/GLP-1/Glucagon receptor. 99%+ purity verified.',
  },
  {
    name: 'AOD-9604',
    slug: 'aod-9604',
    sku: 'SBB-AOD-BASE',
    categorySlug: 'metabolic-peptides',
    shortDescription: 'HGH fragment for fat metabolism research',
    description: `AOD-9604 is a modified fragment of human growth hormone C-terminus studied for fat metabolism without affecting blood glucose.

**Research Applications:**
- Lipolysis pathway studies
- Fat metabolism research
- HGH fragment mechanisms
- Metabolic studies

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 130.00,
    variants: [
      { name: '5mg Vial', sku: 'SBB-AOD-5MG', strengthValue: 5, strengthUnit: 'MG', price: 130.00, priceCents: 13000, stock: 100 },
    ],
    tags: ['metabolic', 'hgh-fragment'],
    isFeatured: false,
    metaTitle: 'AOD-9604 5mg | Fat Metabolism Research | Science Based Body',
    metaDescription: 'AOD-9604 HGH fragment for metabolic research. 99%+ purity. Third-party tested.',
  },
  {
    name: '5-Amino-1MQ',
    slug: '5-amino-1mq',
    sku: 'SBB-5A1MQ-BASE',
    categorySlug: 'metabolic-peptides',
    shortDescription: 'NNMT inhibitor for metabolic research',
    description: `5-Amino-1MQ is a small molecule NNMT inhibitor studied for cellular metabolism and energy expenditure.

**Research Applications:**
- NNMT enzyme inhibition studies
- NAD+ salvage pathway research
- Metabolic function studies

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 89.00,
    variants: [
      { name: '5mg Vial', sku: 'SBB-5A1MQ-5MG', strengthValue: 5, strengthUnit: 'MG', price: 89.00, priceCents: 8900, stock: 100 },
    ],
    tags: ['metabolic', 'small-molecule'],
    isFeatured: false,
    metaTitle: '5-Amino-1MQ | NNMT Inhibitor | Science Based Body',
    metaDescription: '5-Amino-1MQ NNMT inhibitor for metabolic research. 99%+ purity verified.',
  },
  {
    name: 'SLU-PP-332',
    slug: 'slu-pp-332',
    sku: 'SBB-SLUPP-BASE',
    categorySlug: 'metabolic-peptides',
    shortDescription: 'ERR agonist for exercise mimetic research',
    description: `SLU-PP-332 is an ERR agonist that mimics exercise-induced metabolic changes for endurance and fat oxidation research.

**Research Applications:**
- Exercise mimetic studies
- ERR receptor research
- Fat oxidation pathways
- Endurance mechanisms

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 169.00,
    variants: [
      { name: '5mg Vial', sku: 'SBB-SLUPP-5MG', strengthValue: 5, strengthUnit: 'MG', price: 169.00, priceCents: 16900, stock: 75 },
    ],
    tags: ['new', 'exercise-mimetic'],
    isFeatured: false,
    metaTitle: 'SLU-PP-332 | Exercise Mimetic | Science Based Body',
    metaDescription: 'SLU-PP-332 ERR agonist for exercise mimetic research. 99%+ purity.',
  },

  // --------------------------------------------------------------------------
  // RECOVERY PEPTIDES
  // --------------------------------------------------------------------------
  {
    name: 'BPC-157',
    slug: 'bpc-157',
    sku: 'SBB-BPC157-BASE',
    categorySlug: 'recovery-peptides',
    shortDescription: 'Gastric pentadecapeptide for tissue healing research',
    description: `BPC-157 is a pentadecapeptide derived from gastric juice proteins, extensively studied for tissue healing and cytoprotection.

**Research Applications:**
- Tissue repair mechanisms
- Gastrointestinal studies
- Tendon and ligament research
- Wound healing pathways
- Angiogenesis studies

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Sequence: Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val
- Form: Lyophilized powder`,
    basePrice: 125.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-BPC157-10MG', strengthValue: 10, strengthUnit: 'MG', price: 125.00, priceCents: 12500, stock: 150 },
    ],
    tags: ['bestseller', 'healing', 'recovery'],
    isFeatured: true,
    metaTitle: 'BPC-157 10mg | Tissue Healing Research | Science Based Body',
    metaDescription: 'Premium BPC-157 peptide for research. 99%+ purity, third-party tested. Same-day shipping.',
  },
  {
    name: 'TB-500',
    slug: 'tb-500',
    sku: 'SBB-TB500-BASE',
    categorySlug: 'recovery-peptides',
    shortDescription: 'Thymosin Beta-4 for regeneration research',
    description: `TB-500 is a synthetic peptide derived from Thymosin Beta-4, studied for wound healing and tissue regeneration.

**Research Applications:**
- Tissue regeneration studies
- Cardiac repair research
- Muscle healing mechanisms
- Angiogenesis pathways
- Inflammation modulation

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 180.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-TB500-10MG', strengthValue: 10, strengthUnit: 'MG', price: 180.00, priceCents: 18000, stock: 125 },
    ],
    tags: ['recovery', 'regeneration', 'thymosin'],
    isFeatured: true,
    metaTitle: 'TB-500 10mg | Thymosin Beta-4 | Science Based Body',
    metaDescription: 'TB-500 thymosin beta-4 peptide for tissue regeneration research. 99%+ purity.',
  },
  {
    name: 'GHK-Cu',
    slug: 'ghk-cu',
    sku: 'SBB-GHKCU-BASE',
    categorySlug: 'recovery-peptides',
    shortDescription: 'Copper peptide for skin and tissue research',
    description: `GHK-Cu is a copper-binding tripeptide that promotes collagen and elastin production for wound healing research.

**Research Applications:**
- Wound healing mechanisms
- Collagen synthesis studies
- Hair follicle research
- Skin regeneration pathways

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder with copper complex`,
    basePrice: 125.00,
    variants: [
      { name: '100mg Vial', sku: 'SBB-GHKCU-100MG', strengthValue: 100, strengthUnit: 'MG', price: 125.00, priceCents: 12500, stock: 100 },
    ],
    tags: ['copper', 'regenerative', 'collagen'],
    isFeatured: false,
    metaTitle: 'GHK-Cu 100mg | Copper Peptide | Science Based Body',
    metaDescription: 'GHK-Cu copper peptide for wound healing research. 99%+ purity. Fast shipping.',
  },
  {
    name: 'KPV',
    slug: 'kpv',
    sku: 'SBB-KPV-BASE',
    categorySlug: 'recovery-peptides',
    shortDescription: 'Alpha-MSH tripeptide for inflammation research',
    description: `KPV is an alpha-MSH derived tripeptide with anti-inflammatory properties for tissue healing studies.

**Research Applications:**
- Inflammatory pathway studies
- Tissue healing research
- Immunomodulation
- Gut health studies

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 79.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-KPV-10MG', strengthValue: 10, strengthUnit: 'MG', price: 79.00, priceCents: 7900, stock: 100 },
    ],
    tags: ['anti-inflammatory', 'recovery'],
    isFeatured: false,
    metaTitle: 'KPV 10mg | Anti-Inflammatory Peptide | Science Based Body',
    metaDescription: 'KPV alpha-MSH tripeptide for inflammation research. 99%+ purity.',
  },
  {
    name: 'Thymosin Alpha-1',
    slug: 'thymosin-alpha-1',
    sku: 'SBB-TA1-BASE',
    categorySlug: 'recovery-peptides',
    shortDescription: 'Thymic peptide for immune function research',
    description: `Thymosin Alpha-1 is a thymic peptide that regulates immune function and T-cell maturation.

**Research Applications:**
- Immune function studies
- T-cell maturation research
- Immune activation pathways
- Thymic hormone studies

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 120.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-TA1-10MG', strengthValue: 10, strengthUnit: 'MG', price: 120.00, priceCents: 12000, stock: 75 },
    ],
    tags: ['immune', 'thymic'],
    isFeatured: false,
    metaTitle: 'Thymosin Alpha-1 10mg | Immune Research | Science Based Body',
    metaDescription: 'Thymosin Alpha-1 for immune function research. 99%+ purity verified.',
  },

  // --------------------------------------------------------------------------
  // GROWTH HORMONE SECRETAGOGUES
  // --------------------------------------------------------------------------
  {
    name: 'Tesamorelin',
    slug: 'tesamorelin',
    sku: 'SBB-TESAM-BASE',
    categorySlug: 'growth-hormone',
    shortDescription: 'GHRH analog for growth hormone research',
    description: `Tesamorelin is a synthetic GHRH analog that stimulates growth hormone release from the pituitary.

**Research Applications:**
- GHRH pathway studies
- Pituitary function research
- Body composition studies
- GH secretion mechanisms

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 199.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-TESAM-10MG', strengthValue: 10, strengthUnit: 'MG', price: 199.00, priceCents: 19900, stock: 75 },
    ],
    tags: ['ghrh', 'growth-hormone'],
    isFeatured: false,
    metaTitle: 'Tesamorelin 10mg | GHRH Analog | Science Based Body',
    metaDescription: 'Tesamorelin GHRH analog for growth hormone research. 99%+ purity.',
  },
  {
    name: 'Ipamorelin',
    slug: 'ipamorelin',
    sku: 'SBB-IPAM-BASE',
    categorySlug: 'growth-hormone',
    shortDescription: 'Selective GHRP for GH release research',
    description: `Ipamorelin is a pentapeptide ghrelin mimetic with high selectivity for GH release without affecting cortisol or prolactin.

**Research Applications:**
- Selective GH release studies
- Ghrelin receptor research
- Clean GH secretagogue studies
- Metabolic research

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 99.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-IPAM-10MG', strengthValue: 10, strengthUnit: 'MG', price: 99.00, priceCents: 9900, stock: 150 },
    ],
    tags: ['ghrp', 'selective', 'growth-hormone'],
    isFeatured: false,
    metaTitle: 'Ipamorelin 10mg | GH Secretagogue | Science Based Body',
    metaDescription: 'Ipamorelin selective GH secretagogue for research. 99%+ purity. Same-day shipping.',
  },
  {
    name: 'CJC-1295 (with DAC)',
    slug: 'cjc-1295-dac',
    sku: 'SBB-CJC1295DAC-BASE',
    categorySlug: 'growth-hormone',
    shortDescription: 'Extended half-life GHRH analog',
    description: `CJC-1295 with Drug Affinity Complex (DAC) is a modified GHRH analog with extended half-life for sustained GH research.

**Research Applications:**
- Sustained GH release studies
- GHRH analog research
- Long-acting peptide mechanisms
- IGF-1 pathway studies

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder with DAC modification`,
    basePrice: 189.00,
    variants: [
      { name: '5mg Vial', sku: 'SBB-CJC1295DAC-5MG', strengthValue: 5, strengthUnit: 'MG', price: 189.00, priceCents: 18900, stock: 100 },
    ],
    tags: ['ghrh', 'long-acting', 'growth-hormone'],
    isFeatured: false,
    metaTitle: 'CJC-1295 DAC 5mg | Long-Acting GHRH | Science Based Body',
    metaDescription: 'CJC-1295 with DAC for sustained GH research. 99%+ purity verified.',
  },
  {
    name: 'IGF-1 LR3',
    slug: 'igf-1-lr3',
    sku: 'SBB-IGF1LR3-BASE',
    categorySlug: 'growth-hormone',
    shortDescription: 'Extended IGF-1 for growth research',
    description: `IGF-1 LR3 is a modified insulin-like growth factor with extended half-life due to LR3 modification preventing IGF-BP binding.

**Research Applications:**
- Muscle protein synthesis studies
- Cell growth pathways
- IGF receptor research
- Growth factor mechanisms

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 49.00,
    variants: [
      { name: '0.1mg Vial', sku: 'SBB-IGF1LR3-0.1MG', strengthValue: 0.1, strengthUnit: 'MG', price: 49.00, priceCents: 4900, stock: 100 },
      { name: '1mg Vial', sku: 'SBB-IGF1LR3-1MG', strengthValue: 1, strengthUnit: 'MG', price: 249.00, priceCents: 24900, stock: 50 },
    ],
    tags: ['igf', 'growth-factor'],
    isFeatured: false,
    metaTitle: 'IGF-1 LR3 | Growth Factor Research | Science Based Body',
    metaDescription: 'IGF-1 LR3 modified growth factor for research. 99%+ purity. Multiple sizes.',
  },

  // --------------------------------------------------------------------------
  // NOOTROPIC PEPTIDES
  // --------------------------------------------------------------------------
  {
    name: 'Semax',
    slug: 'semax',
    sku: 'SBB-SEMAX-BASE',
    categorySlug: 'nootropic-peptides',
    shortDescription: 'ACTH fragment for cognitive research',
    description: `Semax is a synthetic peptide derived from ACTH studied for effects on BDNF and cognitive function.

**Research Applications:**
- BDNF expression studies
- Neuroprotection research
- Cognitive function studies
- NGF pathway research

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 79.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-SEMAX-10MG', strengthValue: 10, strengthUnit: 'MG', price: 79.00, priceCents: 7900, stock: 100 },
    ],
    tags: ['nootropic', 'cognitive', 'bdnf'],
    isFeatured: true,
    metaTitle: 'Semax 10mg | Cognitive Research Peptide | Science Based Body',
    metaDescription: 'Semax ACTH peptide for cognitive research. 99%+ purity. Third-party verified.',
  },
  {
    name: 'Selank',
    slug: 'selank',
    sku: 'SBB-SELANK-BASE',
    categorySlug: 'nootropic-peptides',
    shortDescription: 'Tuftsin analog for anxiolytic research',
    description: `Selank is a synthetic tuftsin analog with anxiolytic and immunomodulatory properties.

**Research Applications:**
- Anxiolytic pathway studies
- GABA modulation research
- Emotional regulation studies
- Stress response mechanisms

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 89.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-SELANK-10MG', strengthValue: 10, strengthUnit: 'MG', price: 89.00, priceCents: 8900, stock: 100 },
    ],
    tags: ['nootropic', 'anxiolytic'],
    isFeatured: false,
    metaTitle: 'Selank 10mg | Anxiolytic Peptide | Science Based Body',
    metaDescription: 'Selank anxiolytic peptide for cognitive research. 99%+ purity verified.',
  },
  {
    name: 'Pinealon',
    slug: 'pinealon',
    sku: 'SBB-PINEALON-BASE',
    categorySlug: 'nootropic-peptides',
    shortDescription: 'Pineal bioregulator for brain research',
    description: `Pinealon is a tripeptide bioregulator derived from the pineal gland for brain function studies.

**Research Applications:**
- Neuroprotection studies
- Pineal gland research
- Gene regulation studies
- Brain function mechanisms

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 89.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-PINEALON-10MG', strengthValue: 10, strengthUnit: 'MG', price: 89.00, priceCents: 8900, stock: 75 },
    ],
    tags: ['nootropic', 'bioregulator', 'pineal'],
    isFeatured: false,
    metaTitle: 'Pinealon 10mg | Pineal Bioregulator | Science Based Body',
    metaDescription: 'Pinealon tripeptide bioregulator for brain research. 99%+ purity.',
  },
  {
    name: 'DSIP',
    slug: 'dsip',
    sku: 'SBB-DSIP-BASE',
    categorySlug: 'nootropic-peptides',
    shortDescription: 'Delta sleep peptide for circadian research',
    description: `DSIP (Delta Sleep-Inducing Peptide) influences sleep patterns and stress adaptation.

**Research Applications:**
- Sleep architecture studies
- Circadian rhythm research
- Stress adaptation mechanisms
- Neuroendocrine studies

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 59.00,
    variants: [
      { name: '5mg Vial', sku: 'SBB-DSIP-5MG', strengthValue: 5, strengthUnit: 'MG', price: 59.00, priceCents: 5900, stock: 100 },
    ],
    tags: ['sleep', 'circadian', 'nootropic'],
    isFeatured: false,
    metaTitle: 'DSIP 5mg | Sleep Peptide | Science Based Body',
    metaDescription: 'DSIP delta sleep peptide for circadian research. 99%+ purity.',
  },

  // --------------------------------------------------------------------------
  // LONGEVITY PEPTIDES
  // --------------------------------------------------------------------------
  {
    name: 'Epithalon',
    slug: 'epithalon',
    sku: 'SBB-EPITH-BASE',
    categorySlug: 'longevity-peptides',
    shortDescription: 'Telomerase activator for longevity research',
    description: `Epithalon is a pineal tetrapeptide studied for telomerase activation and cellular senescence.

**Research Applications:**
- Telomerase activation studies
- Cellular aging research
- Longevity pathway mechanisms
- Pineal function studies

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Sequence: Ala-Glu-Asp-Gly
- Form: Lyophilized powder`,
    basePrice: 69.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-EPITH-10MG', strengthValue: 10, strengthUnit: 'MG', price: 69.00, priceCents: 6900, stock: 100 },
      { name: '50mg Vial', sku: 'SBB-EPITH-50MG', strengthValue: 50, strengthUnit: 'MG', price: 179.00, priceCents: 17900, stock: 50 },
    ],
    tags: ['longevity', 'telomerase', 'anti-aging'],
    isFeatured: true,
    metaTitle: 'Epithalon | Telomerase Activator | Science Based Body',
    metaDescription: 'Epithalon tetrapeptide for longevity research. 99%+ purity. Multiple sizes.',
  },
  {
    name: 'NAD+',
    slug: 'nad-plus',
    sku: 'SBB-NAD-BASE',
    categorySlug: 'longevity-peptides',
    shortDescription: 'Coenzyme for cellular energy research',
    description: `NAD+ is a coenzyme essential for cellular metabolism, energy production, and DNA repair.

**Research Applications:**
- Mitochondrial function studies
- Aging pathway research
- DNA repair mechanisms
- Sirtuin activation studies

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 230.00,
    variants: [
      { name: '500mg Vial', sku: 'SBB-NAD-500MG', strengthValue: 500, strengthUnit: 'MG', price: 230.00, priceCents: 23000, stock: 75 },
    ],
    tags: ['longevity', 'mitochondrial', 'energy'],
    isFeatured: true,
    metaTitle: 'NAD+ 500mg | Cellular Energy Research | Science Based Body',
    metaDescription: 'NAD+ coenzyme for longevity and mitochondrial research. 99%+ purity.',
  },
  {
    name: 'SS-31 (Elamipretide)',
    slug: 'ss-31',
    sku: 'SBB-SS31-BASE',
    categorySlug: 'longevity-peptides',
    shortDescription: 'Mitochondrial peptide for cellular research',
    description: `SS-31 is a cell-permeable peptide that concentrates in mitochondria for oxidative stress research.

**Research Applications:**
- Mitochondrial membrane studies
- Oxidative stress research
- Cardiolipin binding mechanisms
- Cytoprotection pathways

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 129.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-SS31-10MG', strengthValue: 10, strengthUnit: 'MG', price: 129.00, priceCents: 12900, stock: 75 },
      { name: '50mg Vial', sku: 'SBB-SS31-50MG', strengthValue: 50, strengthUnit: 'MG', price: 450.00, priceCents: 45000, stock: 25 },
    ],
    tags: ['longevity', 'mitochondrial'],
    isFeatured: false,
    metaTitle: 'SS-31 Elamipretide | Mitochondrial Peptide | Science Based Body',
    metaDescription: 'SS-31 mitochondrial peptide for cellular research. 99%+ purity. Multiple sizes.',
  },

  // --------------------------------------------------------------------------
  // SPECIALTY PEPTIDES
  // --------------------------------------------------------------------------
  {
    name: 'PT-141',
    slug: 'pt-141',
    sku: 'SBB-PT141-BASE',
    categorySlug: 'specialty-peptides',
    shortDescription: 'Melanocortin agonist for CNS research',
    description: `PT-141 is a melanocortin receptor agonist affecting central nervous system pathways.

**Research Applications:**
- Melanocortin receptor studies
- MC3/MC4 receptor research
- CNS pathway mechanisms
- Behavioral research

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 69.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-PT141-10MG', strengthValue: 10, strengthUnit: 'MG', price: 69.00, priceCents: 6900, stock: 100 },
    ],
    tags: ['melanocortin', 'cns'],
    isFeatured: false,
    metaTitle: 'PT-141 10mg | Melanocortin Agonist | Science Based Body',
    metaDescription: 'PT-141 melanocortin receptor agonist for research. 99%+ purity.',
  },
  {
    name: 'Kisspeptin-10',
    slug: 'kisspeptin-10',
    sku: 'SBB-KISS10-BASE',
    categorySlug: 'specialty-peptides',
    shortDescription: 'Hypothalamic peptide for endocrine research',
    description: `Kisspeptin-10 is a hypothalamic neuropeptide regulating gonadotropin-releasing hormone.

**Research Applications:**
- Reproductive endocrinology studies
- GnRH regulation research
- Puberty mechanism studies
- Hypothalamic function

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 110.00,
    variants: [
      { name: '10mg Vial', sku: 'SBB-KISS10-10MG', strengthValue: 10, strengthUnit: 'MG', price: 110.00, priceCents: 11000, stock: 75 },
    ],
    tags: ['endocrine', 'reproductive'],
    isFeatured: false,
    metaTitle: 'Kisspeptin-10 | Endocrine Research Peptide | Science Based Body',
    metaDescription: 'Kisspeptin-10 for reproductive endocrinology research. 99%+ purity.',
  },
  {
    name: 'hCG',
    slug: 'hcg',
    sku: 'SBB-HCG-BASE',
    categorySlug: 'specialty-peptides',
    shortDescription: 'Gonadotropin for endocrine research',
    description: `hCG (Human Chorionic Gonadotropin) is a glycoprotein hormone affecting reproductive and metabolic pathways.

**Research Applications:**
- LH-mimetic activity studies
- Steroidogenic pathway research
- Reproductive endocrinology
- Metabolic research

**Specifications:**
- Purity: High-purity research grade
- Form: Lyophilized powder`,
    basePrice: 109.00,
    variants: [
      { name: '5000 IU Vial', sku: 'SBB-HCG-5000IU', strengthValue: 5000, strengthUnit: 'IU', price: 109.00, priceCents: 10900, stock: 75 },
      { name: '10000 IU Vial', sku: 'SBB-HCG-10000IU', strengthValue: 10000, strengthUnit: 'IU', price: 209.00, priceCents: 20900, stock: 50 },
    ],
    tags: ['endocrine', 'gonadotropin'],
    isFeatured: false,
    metaTitle: 'hCG | Gonadotropin Research | Science Based Body',
    metaDescription: 'hCG gonadotropin for endocrine research. High-purity. Multiple sizes.',
  },
  {
    name: 'Oxytocin',
    slug: 'oxytocin',
    sku: 'SBB-OXY-BASE',
    categorySlug: 'specialty-peptides',
    shortDescription: 'Neuropeptide for behavioral research',
    description: `Oxytocin is a neuropeptide hormone studied for social behavior and neural circuit effects.

**Research Applications:**
- Social behavior studies
- Neural circuit research
- Bonding mechanism studies
- Neuromodulation pathways

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder`,
    basePrice: 59.00,
    variants: [
      { name: '2mg Vial', sku: 'SBB-OXY-2MG', strengthValue: 2, strengthUnit: 'MG', price: 59.00, priceCents: 5900, stock: 100 },
    ],
    tags: ['neuropeptide', 'behavioral'],
    isFeatured: false,
    metaTitle: 'Oxytocin 2mg | Neuropeptide Research | Science Based Body',
    metaDescription: 'Oxytocin neuropeptide for behavioral research. 99%+ purity.',
  },

  // --------------------------------------------------------------------------
  // PEPTIDE BLENDS
  // --------------------------------------------------------------------------
  {
    name: 'CJC-1295 + Ipamorelin',
    slug: 'cjc-1295-ipamorelin',
    sku: 'SBB-CJCIPAM-BASE',
    categorySlug: 'peptide-blends',
    shortDescription: 'Synergistic GH secretagogue blend',
    description: `Combined GHRH analog and selective GH secretagogue (5mg CJC-1295 + 5mg Ipamorelin) for amplified pulsatile GH release research.

**Includes:**
- 5mg CJC-1295 (no DAC)
- 5mg Ipamorelin
- Synergistic GH pathway activation

**Research Applications:**
- Pulsatile GH release studies
- Synergistic secretagogue research
- Combined GHRH/GHRP pathways

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder blend`,
    basePrice: 129.00,
    variants: [
      { name: '10mg Blend', sku: 'SBB-CJCIPAM-10MG', strengthValue: 10, strengthUnit: 'MG', price: 129.00, priceCents: 12900, stock: 100 },
    ],
    tags: ['bestseller', 'blend', 'growth-hormone'],
    isFeatured: true,
    metaTitle: 'CJC-1295 + Ipamorelin Blend | Science Based Body',
    metaDescription: 'Synergistic CJC-1295 + Ipamorelin blend for GH research. 99%+ purity.',
  },
  {
    name: 'BPC-157 + TB-500',
    slug: 'bpc-157-tb-500',
    sku: 'SBB-BPCTB-BASE',
    categorySlug: 'peptide-blends',
    shortDescription: 'Ultimate recovery peptide blend',
    description: `Combined BPC-157 and TB-500 for enhanced tissue healing and regeneration research.

**Includes:**
- 5mg BPC-157
- 5mg TB-500
- Complementary healing pathways

**Research Applications:**
- Synergistic tissue repair studies
- Comprehensive regeneration research
- Combined healing mechanism studies

**Specifications:**
- Purity: 99%+ (HPLC verified)
- Form: Lyophilized powder blend`,
    basePrice: 129.00,
    variants: [
      { name: '10mg Blend', sku: 'SBB-BPCTB-10MG', strengthValue: 10, strengthUnit: 'MG', price: 129.00, priceCents: 12900, stock: 100 },
    ],
    tags: ['bestseller', 'blend', 'recovery'],
    isFeatured: true,
    metaTitle: 'BPC-157 + TB-500 Healing Blend | Science Based Body',
    metaDescription: 'BPC-157 + TB-500 recovery blend for tissue healing research. 99%+ purity.',
  },
  {
    name: 'SNAP-8 + GHK-Cu Serum',
    slug: 'snap8-ghkcu-serum',
    sku: 'SBB-SNAP8GHKCU-BASE',
    categorySlug: 'peptide-blends',
    shortDescription: 'Advanced skin research serum',
    description: `Advanced research serum combining SNAP-8 octapeptide with GHK-Cu copper peptide complex.

**Includes:**
- SNAP-8 octapeptide
- GHK-Cu copper peptide
- Ready-to-use formulation

**Research Applications:**
- Topical skin research
- Collagen synthesis studies
- Expression line modulation

**Specifications:**
- Pre-formulated topical serum
- 30ml bottle`,
    basePrice: 100.00,
    variants: [
      { name: '30ml Serum', sku: 'SBB-SNAP8GHKCU-30ML', strengthValue: 30, strengthUnit: 'ML', price: 100.00, priceCents: 10000, stock: 50 },
    ],
    tags: ['serum', 'skin', 'topical'],
    isFeatured: false,
    metaTitle: 'SNAP-8 + GHK-Cu Serum | Skin Research | Science Based Body',
    metaDescription: 'SNAP-8 + GHK-Cu topical serum for skin research. Ready-to-use formulation.',
  },
];

// ============================================================================
// BATCH DATA FOR COA
// ============================================================================

export interface BatchSeedData {
  batchNumber: string;
  productSku: string;
  manufacturedDate: Date;
  expirationDate: Date;
  purity: number;
  testingLab: string;
  testDate: Date;
}

export const batches: BatchSeedData[] = [
  // Metabolic Peptides
  {
    batchNumber: 'SBB-2025-SEMA-001',
    productSku: 'SBB-SEMA-10MG',
    manufacturedDate: new Date('2025-01-10'),
    expirationDate: new Date('2027-01-10'),
    purity: 99.5,
    testingLab: 'Janoshik Analytical',
    testDate: new Date('2025-01-12'),
  },
  {
    batchNumber: 'SBB-2025-RETA-001',
    productSku: 'SBB-RETA-10MG',
    manufacturedDate: new Date('2025-01-08'),
    expirationDate: new Date('2027-01-08'),
    purity: 99.3,
    testingLab: 'Janoshik Analytical',
    testDate: new Date('2025-01-10'),
  },
  // Recovery Peptides
  {
    batchNumber: 'SBB-2025-BPC-001',
    productSku: 'SBB-BPC157-10MG',
    manufacturedDate: new Date('2025-01-05'),
    expirationDate: new Date('2027-01-05'),
    purity: 99.7,
    testingLab: 'Colmaric Analyticals',
    testDate: new Date('2025-01-07'),
  },
  {
    batchNumber: 'SBB-2025-TB500-001',
    productSku: 'SBB-TB500-10MG',
    manufacturedDate: new Date('2025-01-06'),
    expirationDate: new Date('2027-01-06'),
    purity: 99.4,
    testingLab: 'Janoshik Analytical',
    testDate: new Date('2025-01-08'),
  },
  // Nootropics
  {
    batchNumber: 'SBB-2025-SEMAX-001',
    productSku: 'SBB-SEMAX-10MG',
    manufacturedDate: new Date('2025-01-12'),
    expirationDate: new Date('2027-01-12'),
    purity: 99.6,
    testingLab: 'Janoshik Analytical',
    testDate: new Date('2025-01-14'),
  },
  // Longevity
  {
    batchNumber: 'SBB-2025-EPITH-001',
    productSku: 'SBB-EPITH-10MG',
    manufacturedDate: new Date('2025-01-15'),
    expirationDate: new Date('2027-01-15'),
    purity: 99.8,
    testingLab: 'Colmaric Analyticals',
    testDate: new Date('2025-01-17'),
  },
  {
    batchNumber: 'SBB-2025-NAD-001',
    productSku: 'SBB-NAD-500MG',
    manufacturedDate: new Date('2025-01-14'),
    expirationDate: new Date('2027-01-14'),
    purity: 99.2,
    testingLab: 'Janoshik Analytical',
    testDate: new Date('2025-01-16'),
  },
  // Blends
  {
    batchNumber: 'SBB-2025-CJCIPAM-001',
    productSku: 'SBB-CJCIPAM-10MG',
    manufacturedDate: new Date('2025-01-18'),
    expirationDate: new Date('2027-01-18'),
    purity: 99.4,
    testingLab: 'Janoshik Analytical',
    testDate: new Date('2025-01-20'),
  },
  {
    batchNumber: 'SBB-2025-BPCTB-001',
    productSku: 'SBB-BPCTB-10MG',
    manufacturedDate: new Date('2025-01-17'),
    expirationDate: new Date('2027-01-17'),
    purity: 99.5,
    testingLab: 'Colmaric Analyticals',
    testDate: new Date('2025-01-19'),
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string) {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getFeaturedProducts() {
  return products.filter((p) => p.isFeatured);
}

export function getBestsellers() {
  return products.filter((p) => p.tags?.includes('bestseller'));
}

export function getNewProducts() {
  return products.filter((p) => p.tags?.includes('new'));
}

export default {
  categories,
  products,
  batches,
  getProductBySlug,
  getProductsByCategory,
  getFeaturedProducts,
  getBestsellers,
  getNewProducts,
};
