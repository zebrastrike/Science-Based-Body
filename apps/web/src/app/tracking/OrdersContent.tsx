'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ── Types ── */
interface TimelineStage {
  stage: number;
  label: string;
  status: 'complete' | 'current' | 'pending';
  date: string | null;
}

interface OrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

interface ShipmentInfo {
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  postalCode: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  shipment?: ShipmentInfo;
  statusTimeline: TimelineStage[];
}

/* ── Constants ── */
const API_BASE =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api/v1'
    : 'https://api.sbbpeptides.com/api/v1';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order Placed',
  AWAITING_PAYMENT: 'Awaiting Payment',
  PAYMENT_RECEIVED: 'Payment Verified',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const STATUS_BADGE_MAP: Record<string, string> = {
  PENDING: 'pending',
  AWAITING_PAYMENT: 'awaiting',
  PAYMENT_RECEIVED: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

/* ── Helpers ── */
function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem('accessToken') && localStorage.getItem('sbb_user'));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: string | number): string {
  return '$' + Number(amount).toFixed(2);
}

/* ── SVG Tracker Icons ── */
const TrackerIcons = [
  /* 1 — Order Placed */
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
  </svg>,
  /* 2 — Payment Verified */
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>,
  /* 3 — Preparing */
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>,
  /* 4 — Shipped */
  <svg key="4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>,
  /* 5 — Delivered */
  <svg key="5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>,
];

/* ── Sub-components ── */

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE_MAP[status] || 'pending';
  return (
    <span className={`status-badge status-badge-${cls}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function MiniTracker({ timeline }: { timeline: TimelineStage[] }) {
  return (
    <div className="mini-tracker">
      {timeline.map((s, i) => (
        <span key={s.stage} style={{ display: 'contents' }}>
          <div className={`mini-tracker-dot is-${s.status}`} />
          {i < timeline.length - 1 && (
            <div className={`mini-tracker-line${s.status === 'complete' ? ' is-complete' : ''}`} />
          )}
        </span>
      ))}
    </div>
  );
}

function FullTracker({ timeline }: { timeline: TimelineStage[] }) {
  return (
    <div className="order-tracker">
      {timeline.map((s, i) => (
        <span key={s.stage} style={{ display: 'contents' }}>
          <div className={`tracker-step is-${s.status}`}>
            <div className="tracker-circle">{TrackerIcons[i]}</div>
            <span className="tracker-label">{s.label}</span>
            {s.date && <span className="tracker-date">{formatDate(s.date)}</span>}
          </div>
          {i < timeline.length - 1 && (
            <div className={`tracker-connector${s.status === 'complete' ? ' is-complete' : ''}`} />
          )}
        </span>
      ))}
    </div>
  );
}

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const itemCount = order.items?.length || 0;
  const itemLabel = itemCount === 1 ? '1 item' : `${itemCount} items`;

  return (
    <div className="order-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="order-card-header">
        <span className="order-card-number">{order.orderNumber}</span>
        <span className="order-card-date">{formatDate(order.createdAt)}</span>
      </div>
      <div className="order-card-body">
        <div className="order-card-info">
          <span>{itemLabel}</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
        <StatusBadge status={order.status} />
      </div>
      {order.statusTimeline && <MiniTracker timeline={order.statusTimeline} />}
    </div>
  );
}

function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  return (
    <>
      <button className="order-detail-back" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Orders
      </button>

      <div className="order-detail-panel">
        {/* Header */}
        <div className="order-detail-header">
          <h2>{order.orderNumber}</h2>
          <StatusBadge status={order.status} />
        </div>

        {/* 5-stage tracker */}
        {order.statusTimeline && <FullTracker timeline={order.statusTimeline} />}

        {/* Items */}
        <div className="order-items-list">
          {order.items?.map((item) => (
            <div key={item.id} className="order-item-row">
              <span className="order-item-name">
                {item.productName}
                {item.variantName ? ` — ${item.variantName}` : ''}
              </span>
              <span className="order-item-qty">&times;{item.quantity}</span>
              <span className="order-item-price">{formatCurrency(item.totalPrice)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="order-totals">
          <div className="order-total-row">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="order-total-row">
            <span>Shipping</span>
            <span>{formatCurrency(order.shippingCost)}</span>
          </div>
          {Number(order.taxAmount) > 0 && (
            <div className="order-total-row">
              <span>Tax</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
          )}
          {Number(order.discountAmount) > 0 && (
            <div className="order-total-row">
              <span>Discount</span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          <div className="order-total-row is-total">
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* Shipping address */}
        {order.shippingAddress && (
          <div className="order-detail-section">
            <h3>Shipping Address</h3>
            <div className="order-detail-grid">
              <div className="order-detail-field">
                <label>Name</label>
                <span>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</span>
              </div>
              <div className="order-detail-field">
                <label>Address</label>
                <span>
                  {order.shippingAddress.street1}
                  {order.shippingAddress.street2 ? `, ${order.shippingAddress.street2}` : ''}
                </span>
              </div>
              <div className="order-detail-field">
                <label>City</label>
                <span>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Shipment / Tracking */}
        {order.shipment && (
          <div className="order-detail-section">
            <h3>Shipment Details</h3>
            <div className="order-detail-grid">
              {order.shipment.carrier && (
                <div className="order-detail-field">
                  <label>Carrier</label>
                  <span>{order.shipment.carrier}</span>
                </div>
              )}
              {order.shipment.trackingNumber && (
                <div className="order-detail-field">
                  <label>Tracking Number</label>
                  <span>{order.shipment.trackingNumber}</span>
                </div>
              )}
              {order.shipment.estimatedDelivery && (
                <div className="order-detail-field">
                  <label>Est. Delivery</label>
                  <span>{formatDate(order.shipment.estimatedDelivery)}</span>
                </div>
              )}
            </div>
            {order.shipment.trackingUrl && (
              <a
                href={order.shipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-track-carrier"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Track with Carrier
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Header & Footer (matching site) ── */

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-grid">
        <Link className="logo" href="/">
          <img src="/logo.png" alt="Science Based Body" />
        </Link>
        <div className="site-search" id="site-search">
          <input
            type="text"
            className="site-search-input"
            id="search-input"
            placeholder="Search peptides..."
            autoComplete="off"
            aria-label="Search products"
          />
          <button type="button" className="site-search-btn" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
          <div className="search-results" id="search-results" />
        </div>
        <button className="menu-toggle" aria-label="Toggle menu" aria-expanded="false">
          <span className="menu-icon" />
        </button>
        <button type="button" className="mobile-search-toggle" id="mobile-search-toggle" aria-label="Search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
        <nav className="site-nav">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/shop" className="nav-link">Shop</Link>
          <Link href="/product" className="nav-link">Peptide Library</Link>
          <Link href="/branded-for-science" className="nav-link">Branded for Science</Link>
          <Link href="/brand-partnerships" className="nav-link">Brand Partners &amp; Affiliates</Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">
            <Link className="footer-logo" href="/">
              <img src="/logo.png" alt="Science Based Body" />
            </Link>
            <span className="label">SCIENCE BASED BODY</span>
          </div>
          <p>Research peptide supply with transparent batch standards.</p>
        </div>
        <div className="footer-links">
          <Link href="/about" className="text-link">About</Link>
          <Link href="/support" className="text-link">Support</Link>
          <Link href="/faq" className="text-link">FAQ</Link>
          <Link href="/shipping" className="text-link">Shipping</Link>
          <Link href="/returns" className="text-link">Returns</Link>
          <Link href="/tracking" className="text-link">Order Tracking</Link>
          <Link href="/terms" className="text-link">Terms</Link>
          <Link href="/privacy" className="text-link">Privacy</Link>
          <Link href="/cookies" className="text-link">Cookies</Link>
          <Link href="/accessibility" className="text-link">Accessibility</Link>
          <Link href="/testing-standards" className="text-link">Quality Assurance</Link>
          <Link href="/storage-guidelines" className="text-link">Storage Guidelines</Link>
          <Link href="/coa-verification" className="text-link">COA Verification</Link>
          <Link href="/research-use" className="text-link">Research Use Only</Link>
          <Link href="/compliance" className="text-link">Compliance</Link>
          <a href="#" className="text-link">PepTalk</a>
        </div>
      </div>
    </footer>
  );
}

/* ── Bubble Field ── */
function BubbleField() {
  return (
    <div className="bubble-field" aria-hidden="true">
      {Array.from({ length: 20 }, (_, i) => (
        <span key={i} className={`bubble bubble-${i + 1}`} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */

export default function OrdersContent() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');

  // Guest lookup state
  const [lookupOrder, setLookupOrder] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupResult, setLookupResult] = useState<Order | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  /* ── Init ── */
  useEffect(() => {
    const authed = isLoggedIn();
    setLoggedIn(authed);
    if (authed) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, []);

  /* ── Load orders ── */
  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/orders?limit=50`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Show order detail ── */
  const showDetail = useCallback(async (orderId: string) => {
    setView('detail');
    setSelectedOrder(null);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load order');
      const order = await res.json();
      setSelectedOrder(order);
    } catch {
      setSelectedOrder(null);
    }
  }, []);

  /* ── Guest lookup ── */
  const handleGuestLookup = useCallback(async () => {
    const orderNum = lookupOrder.trim();
    const email = lookupEmail.trim();
    setLookupError('');
    setLookupResult(null);

    if (!orderNum || !email) {
      setLookupError('Please enter both your order number and email address.');
      return;
    }

    setLookupLoading(true);
    try {
      const url = `${API_BASE}/orders/lookup?orderNumber=${encodeURIComponent(orderNum)}&email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Order not found');
      }
      const order = await res.json();
      setLookupResult(order);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No order found with that order number and email.';
      setLookupError(message);
    } finally {
      setLookupLoading(false);
    }
  }, [lookupOrder, lookupEmail]);

  /* ── Render ── */
  return (
    <>
      <BubbleField />
      <SiteHeader />

      <main>
        <section className="section">
          <div className="container">
            <div className="section-heading reveal orders-heading">
              <span className="label">MY ORDERS</span>
              <h1>Track Your Orders</h1>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ opacity: 0.5 }}>Loading...</p>
              </div>
            )}

            {/* Guest Lookup (not logged in) */}
            {!loading && !loggedIn && (
              <div>
                <p style={{ textAlign: 'center', marginBottom: '1.5rem', opacity: 0.75, fontSize: '0.9rem' }}>
                  Enter your order number and email to look up your order.
                </p>
                <div className="guest-lookup-form">
                  <input
                    type="text"
                    placeholder="Order Number (e.g. SBB-...)"
                    autoComplete="off"
                    value={lookupOrder}
                    onChange={(e) => setLookupOrder(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGuestLookup()}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    autoComplete="email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGuestLookup()}
                  />
                  {lookupError && (
                    <p className="guest-lookup-error" style={{ display: 'block' }}>
                      {lookupError}
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleGuestLookup}
                    disabled={lookupLoading}
                  >
                    {lookupLoading ? 'Looking up...' : 'Track Order'}
                  </button>
                </div>

                {/* Guest lookup result */}
                {lookupResult && (
                  <div style={{ marginTop: '2rem' }}>
                    <div className="order-detail-panel">
                      <div className="order-detail-header">
                        <h2>{lookupResult.orderNumber}</h2>
                        <StatusBadge status={lookupResult.status} />
                      </div>
                      {lookupResult.statusTimeline && (
                        <FullTracker timeline={lookupResult.statusTimeline} />
                      )}
                      <div className="order-items-list">
                        {lookupResult.items?.map((item) => (
                          <div key={item.id} className="order-item-row">
                            <span className="order-item-name">
                              {item.productName}
                              {item.variantName ? ` — ${item.variantName}` : ''}
                            </span>
                            <span className="order-item-qty">&times;{item.quantity}</span>
                            <span className="order-item-price">{formatCurrency(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="order-totals">
                        <div className="order-total-row is-total">
                          <span>Total</span>
                          <span>{formatCurrency(lookupResult.totalAmount)}</span>
                        </div>
                      </div>
                      {lookupResult.shipment?.trackingUrl && (
                        <div className="order-detail-section">
                          <a
                            href={lookupResult.shipment.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-track-carrier"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            Track with Carrier
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.75rem' }}>Have an account?</p>
                  <Link href="/login?redirect=tracking" className="btn btn-outline">
                    Sign In to View All Orders
                  </Link>
                </div>
              </div>
            )}

            {/* Authenticated Dashboard */}
            {!loading && loggedIn && (
              <div>
                {/* Order List */}
                {view === 'list' && (
                  <div>
                    {orders.length === 0 ? (
                      <div className="orders-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        <p>No orders yet.</p>
                        <Link href="/shop" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                          Browse Products
                        </Link>
                      </div>
                    ) : (
                      <div className="order-cards">
                        {orders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            onClick={() => showDetail(order.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Order Detail */}
                {view === 'detail' && (
                  <div>
                    {selectedOrder ? (
                      <OrderDetail
                        order={selectedOrder}
                        onBack={() => setView('list')}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ opacity: 0.5 }}>Loading order...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
