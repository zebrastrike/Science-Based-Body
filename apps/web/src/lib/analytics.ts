// Science Based Body - Analytics & Tracking
// Google Analytics 4 + Facebook Pixel + Custom Events

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

// ============================================================================
// GOOGLE ANALYTICS 4
// ============================================================================

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

export const initGA = () => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });
};

// Page view tracking
export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Event tracking
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number,
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// ============================================================================
// ECOMMERCE TRACKING (GA4 Enhanced Ecommerce)
// ============================================================================

interface ProductItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity?: number;
}

export const trackViewItem = (product: ProductItem) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'view_item', {
    currency: 'USD',
    value: product.price,
    items: [product],
  });
};

export const trackAddToCart = (product: ProductItem, quantity: number = 1) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'add_to_cart', {
    currency: 'USD',
    value: product.price * quantity,
    items: [{ ...product, quantity }],
  });
};

export const trackRemoveFromCart = (product: ProductItem, quantity: number = 1) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'remove_from_cart', {
    currency: 'USD',
    value: product.price * quantity,
    items: [{ ...product, quantity }],
  });
};

export const trackViewCart = (items: ProductItem[], total: number) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'view_cart', {
    currency: 'USD',
    value: total,
    items: items,
  });
};

export const trackBeginCheckout = (items: ProductItem[], total: number) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'begin_checkout', {
    currency: 'USD',
    value: total,
    items: items,
  });
};

export const trackAddShippingInfo = (items: ProductItem[], shippingTier: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'add_shipping_info', {
    currency: 'USD',
    shipping_tier: shippingTier,
    items: items,
  });
};

export const trackAddPaymentInfo = (items: ProductItem[], paymentType: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'add_payment_info', {
    currency: 'USD',
    payment_type: paymentType,
    items: items,
  });
};

export const trackPurchase = (
  transactionId: string,
  items: ProductItem[],
  total: number,
  shipping: number = 0,
  tax: number = 0,
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    currency: 'USD',
    value: total,
    shipping: shipping,
    tax: tax,
    items: items,
  });
};

// ============================================================================
// FACEBOOK PIXEL
// ============================================================================

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || '';

export const initFBPixel = () => {
  if (!FB_PIXEL_ID || typeof window === 'undefined') return;

  // Facebook Pixel base code
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js',
  );

  window.fbq('init', FB_PIXEL_ID);
  window.fbq('track', 'PageView');
};

export const fbPageView = () => {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'PageView');
};

export const fbViewContent = (product: { id: string; name: string; price: number; category?: string }) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    content_category: product.category,
    value: product.price,
    currency: 'USD',
  });
};

export const fbAddToCart = (product: { id: string; name: string; price: number }, quantity: number = 1) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price * quantity,
    currency: 'USD',
  });
};

export const fbInitiateCheckout = (items: { id: string }[], total: number) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'InitiateCheckout', {
    content_ids: items.map((i) => i.id),
    content_type: 'product',
    num_items: items.length,
    value: total,
    currency: 'USD',
  });
};

export const fbPurchase = (orderId: string, items: { id: string }[], total: number) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'Purchase', {
    content_ids: items.map((i) => i.id),
    content_type: 'product',
    num_items: items.length,
    value: total,
    currency: 'USD',
    order_id: orderId,
  });
};

export const fbLead = (email?: string) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'Lead', email ? { email } : {});
};

// ============================================================================
// CUSTOM EVENT HELPERS
// ============================================================================

export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  trackEvent('search', 'engagement', searchTerm, resultsCount);
};

export const trackSignUp = (method: string = 'email') => {
  trackEvent('sign_up', 'engagement', method);
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration', { method });
  }
};

export const trackNewsletterSignup = (email?: string) => {
  trackEvent('newsletter_signup', 'engagement');
  fbLead(email);
};

export const trackContactForm = () => {
  trackEvent('contact_form_submit', 'engagement');
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Contact');
  }
};

export const trackProductFilter = (filterType: string, filterValue: string) => {
  trackEvent('product_filter', 'engagement', `${filterType}:${filterValue}`);
};

export const trackProductSort = (sortOption: string) => {
  trackEvent('product_sort', 'engagement', sortOption);
};

export const trackCOAView = (productName: string, batchNumber: string) => {
  trackEvent('coa_view', 'engagement', `${productName} - ${batchNumber}`);
};

// ============================================================================
// INITIALIZATION
// ============================================================================

export const initAnalytics = () => {
  if (typeof window === 'undefined') return;

  initGA();
  initFBPixel();

  console.log('[Analytics] Initialized');
};

// ============================================================================
// CONSENT MANAGEMENT
// ============================================================================

export const grantConsent = () => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'granted',
  });
};

export const denyConsent = () => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('consent', 'update', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
  });
};
