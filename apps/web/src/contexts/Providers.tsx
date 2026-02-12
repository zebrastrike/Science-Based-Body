'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/contexts/CartContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
