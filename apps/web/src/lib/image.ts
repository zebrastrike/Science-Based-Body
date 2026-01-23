// Science Based Body - Image Utilities
// Optimized image loading and placeholder generation

// Cloudflare R2 / CDN base URL
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || 'https://files.sciencebasedbody.com';

// ============================================================================
// IMAGE URL HELPERS
// ============================================================================

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Generate optimized image URL with transformations
 * Works with Cloudflare Images or similar CDN
 */
export function getImageUrl(
  path: string,
  options: ImageOptions = {},
): string {
  // If already a full URL, return as-is or apply CDN transformations
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Build transformation parameters
  const params: string[] = [];

  if (options.width) params.push(`w=${options.width}`);
  if (options.height) params.push(`h=${options.height}`);
  if (options.quality) params.push(`q=${options.quality}`);
  if (options.format) params.push(`f=${options.format}`);
  if (options.fit) params.push(`fit=${options.fit}`);

  const queryString = params.length > 0 ? `?${params.join('&')}` : '';

  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${CDN_URL}${cleanPath}${queryString}`;
}

/**
 * Generate srcset for responsive images
 */
export function getSrcSet(
  path: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536],
  options: Omit<ImageOptions, 'width'> = {},
): string {
  return widths
    .map((w) => `${getImageUrl(path, { ...options, width: w })} ${w}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function getSizes(breakpoints: { [key: string]: string }): string {
  const entries = Object.entries(breakpoints);
  const sizes = entries.map(([breakpoint, size]) => {
    if (breakpoint === 'default') return size;
    return `(min-width: ${breakpoint}) ${size}`;
  });
  return sizes.join(', ');
}

// ============================================================================
// PLACEHOLDER GENERATION
// ============================================================================

/**
 * Generate a low-quality placeholder data URL
 */
export function getPlaceholder(
  width: number = 10,
  height: number = 10,
  color: string = '#171717',
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Generate shimmer placeholder for loading states
 */
export function getShimmerPlaceholder(
  width: number = 700,
  height: number = 475,
): string {
  const shimmerSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1">
            <animate attributeName="offset" values="-2; -2; 1" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" style="stop-color:#2a2a2a;stop-opacity:1">
            <animate attributeName="offset" values="-1; -1; 2" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1">
            <animate attributeName="offset" values="0; 0; 3" dur="2s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#shimmer)" />
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(shimmerSvg).toString('base64')}`;
}

// ============================================================================
// PRODUCT IMAGE HELPERS
// ============================================================================

/**
 * Get product image URL with fallback
 */
export function getProductImageUrl(
  images: Array<{ url: string; sortOrder?: number }> | undefined,
  options: ImageOptions = {},
): string {
  if (!images || images.length === 0) {
    return '/products/sample-vial.svg';
  }

  // Sort by sortOrder and get first
  const sorted = [...images].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  return getImageUrl(sorted[0].url, options);
}

/**
 * Get all product images sorted
 */
export function getProductImages(
  images: Array<{ url: string; sortOrder?: number; altText?: string }> | undefined,
): Array<{ url: string; alt: string }> {
  if (!images || images.length === 0) {
    return [{ url: '/products/sample-vial.svg', alt: 'Product image' }];
  }

  return [...images]
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((img) => ({
      url: img.url,
      alt: img.altText || 'Product image',
    }));
}

// ============================================================================
// ASPECT RATIO HELPERS
// ============================================================================

export const aspectRatios = {
  square: '1 / 1',
  video: '16 / 9',
  portrait: '3 / 4',
  landscape: '4 / 3',
  wide: '21 / 9',
  product: '1 / 1',
  hero: '16 / 9',
  card: '4 / 3',
};

/**
 * Calculate dimensions maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

// ============================================================================
// BLUR DATA URL GENERATOR (for Next.js Image)
// ============================================================================

/**
 * Generate blur data URL for Next.js Image component
 */
export function generateBlurDataURL(color: string = '#171717'): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="${color}"/></svg>`,
  )}`;
}

// ============================================================================
// LAZY LOADING HELPERS
// ============================================================================

/**
 * Check if image is in viewport (for manual lazy loading)
 */
export function isInViewport(element: Element, threshold: number = 0.1): boolean {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;

  return rect.top <= windowHeight * (1 + threshold) && rect.bottom >= 0;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}

export default {
  getImageUrl,
  getSrcSet,
  getSizes,
  getPlaceholder,
  getShimmerPlaceholder,
  getProductImageUrl,
  getProductImages,
  generateBlurDataURL,
  preloadImage,
  preloadImages,
};
