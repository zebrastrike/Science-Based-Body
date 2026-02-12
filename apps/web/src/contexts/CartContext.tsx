'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Cart uses the same localStorage key as legacy scripts.js for compatibility
const CART_STORAGE_KEY = 'sbb_cart';

export interface CartItem {
  id: string;
  name: string;
  variant?: string;
  variantId?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toast: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCartContext(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch { /* ignore corrupt data */ }
    setMounted(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, mounted]);

  // Expose SBBCart on window for legacy page interop
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).SBBCart = {
      add: addItem,
      remove: removeItem,
      updateQuantity,
      clear: clearCart,
      openDrawer: () => setIsOpen(true),
      closeDrawer: () => setIsOpen(false),
      getItemCount: () => items.reduce((sum, i) => sum + i.quantity, 0),
      getSubtotal: () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    };
  });

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const addItem = useCallback((product: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qty = product.quantity || 1;
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.id === product.id && (i.variant || '') === (product.variant || '')
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + qty };
        return updated;
      }
      return [...prev, { ...product, quantity: qty, price: Number(product.price) || 0 }];
    });
    setIsOpen(true);
    showToast(`${product.name} added to cart`);
  }, [showToast]);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter((_, i) => i !== index));
    } else {
      setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity } : item));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      subtotal,
      isOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openDrawer: () => setIsOpen(true),
      closeDrawer: () => setIsOpen(false),
      toast,
    }}>
      {children}
    </CartContext.Provider>
  );
}
