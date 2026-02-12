'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCartContext } from '@/contexts/CartContext';

export default function CartDrawer() {
  const { items, itemCount, subtotal, isOpen, closeDrawer, removeItem, updateQuantity, toast } = useCartContext();

  // Lock body scroll and handle Escape
  useEffect(() => {
    document.body.classList.toggle('cart-open', isOpen);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeDrawer();
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('cart-open');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeDrawer]);

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="cart-toast is-visible">{toast}</div>
      )}

      {/* Overlay */}
      <div
        className={`cart-overlay${isOpen ? ' is-visible' : ''}`}
        id="cart-overlay"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <aside
        className={`cart-drawer${isOpen ? ' is-open' : ''}`}
        id="cart-drawer"
        aria-hidden={!isOpen}
      >
        <div className="cart-drawer-header">
          <h2>Your Cart</h2>
          <button
            type="button"
            className="cart-drawer-close"
            onClick={closeDrawer}
            aria-label="Close cart"
          >
            &times;
          </button>
        </div>

        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <p className="cart-empty">Your cart is empty.</p>
          ) : (
            items.map((item, index) => (
              <div className="cart-item" key={`${item.id}-${item.variant || ''}-${index}`}>
                <img
                  src={item.image || '/images/products/vial.png'}
                  alt={item.name}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <h4 className="cart-item-name">{item.name}</h4>
                  {item.variant && (
                    <span className="cart-item-variant">{item.variant}</span>
                  )}
                  <span className="cart-item-price">${item.price.toFixed(2)}</span>
                </div>
                <div className="cart-item-actions">
                  <div className="cart-item-qty">
                    <button
                      type="button"
                      className="qty-btn qty-minus"
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      type="button"
                      className="qty-btn qty-plus"
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="cart-item-remove"
                    onClick={() => removeItem(index)}
                    aria-label="Remove item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-drawer-footer">
          <div className="cart-subtotal">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {itemCount > 0 && (
            <Link
              href="/checkout"
              className="btn btn-primary cart-checkout-btn"
              onClick={closeDrawer}
            >
              Proceed to Checkout
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
