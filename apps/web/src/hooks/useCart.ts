// Science Based Body - Cart Hook
// Local storage cart management with API sync

import { useState, useEffect, useCallback } from 'react';
import { api, CartItem, Cart } from '@/lib/api';
import { trackAddToCart, trackRemoveFromCart, trackViewCart } from '@/lib/analytics';

const CART_STORAGE_KEY = 'sbb-cart';

interface UseCartReturn {
  items: CartItem[];
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  applyDiscount: (code: string) => Promise<boolean>;
  discountCode: string | null;
  discountAmount: number;
  syncCart: () => Promise<void>;
}

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setItems(parsed.items || []);
        setDiscountCode(parsed.discountCode || null);
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items, discountCode }),
    );
  }, [items, discountCode]);

  // Sync cart with API for validation and pricing
  const syncCart = useCallback(async () => {
    if (items.length === 0) {
      setCart(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let validatedCart = await api.validateCart(items);

      // Apply discount if we have one
      if (discountCode) {
        validatedCart = await api.applyDiscountCode(items, discountCode);
      }

      setCart(validatedCart);

      // Track cart view
      trackViewCart(
        validatedCart.items.map((item) => ({
          item_id: item.productId,
          item_name: item.product?.name || '',
          item_variant: item.variant?.name,
          price: item.unitPrice || 0,
          quantity: item.quantity,
        })),
        validatedCart.subtotal,
      );
    } catch (err: any) {
      setError(err.message || 'Failed to validate cart');
    } finally {
      setIsLoading(false);
    }
  }, [items, discountCode]);

  // Add item to cart
  const addItem = useCallback(
    async (productId: string, variantId?: string, quantity: number = 1) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.productId === productId && item.variantId === variantId,
        );

        if (existingIndex > -1) {
          // Update quantity of existing item
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
          return updated;
        }

        // Add new item
        return [...prev, { productId, variantId, quantity }];
      });

      // Track analytics
      try {
        const product = await api.getProduct(productId);
        const variant = variantId
          ? product.variants.find((v) => v.id === variantId)
          : undefined;

        trackAddToCart(
          {
            item_id: productId,
            item_name: product.name,
            item_category: product.category?.name,
            item_variant: variant?.name,
            price: variant?.price || product.basePrice,
          },
          quantity,
        );
      } catch {
        // Analytics failure shouldn't break cart
      }
    },
    [],
  );

  // Remove item from cart
  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((prev) => {
      const item = prev.find(
        (i) => i.productId === productId && i.variantId === variantId,
      );

      if (item) {
        trackRemoveFromCart(
          {
            item_id: productId,
            item_name: item.product?.name || '',
            item_variant: item.variant?.name,
            price: item.unitPrice || 0,
          },
          item.quantity,
        );
      }

      return prev.filter(
        (i) => !(i.productId === productId && i.variantId === variantId),
      );
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback(
    (productId: string, variantId: string | undefined, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity }
            : item,
        ),
      );
    },
    [removeItem],
  );

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([]);
    setCart(null);
    setDiscountCode(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  // Apply discount code
  const applyDiscount = useCallback(
    async (code: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const discountedCart = await api.applyDiscountCode(items, code);
        setCart(discountedCart);
        setDiscountCode(code);
        return true;
      } catch (err: any) {
        setError(err.message || 'Invalid discount code');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [items],
  );

  // Calculate totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart?.subtotal || 0;
  const discountAmount = cart?.discountAmount || 0;

  return {
    items,
    cart,
    isLoading,
    error,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyDiscount,
    discountCode,
    discountAmount,
    syncCart,
  };
}

export default useCart;
