'use client';

import { useState, useEffect, useCallback } from 'react';

/* ── Constants ── */
const API_BASE =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api/v1'
    : 'https://api.sbbpeptides.com/api/v1';

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

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(v: string | number): string {
  return '$' + Number(v).toFixed(2);
}

/* ── Types ── */
interface Address {
  id: string; label?: string; firstName: string; lastName: string;
  company?: string; street1: string; street2?: string;
  city: string; state: string; postalCode: string; country: string;
  phone?: string; isDefault: boolean; isBilling: boolean; isShipping: boolean;
}

interface UserProfile {
  id: string; email: string; firstName: string; lastName: string;
  phone?: string; role: string;
}

interface Order {
  id: string; orderNumber: string; status: string; createdAt: string;
  totalAmount: string; items: Array<{ productName: string; variantName?: string; quantity: number }>;
  statusTimeline: Array<{ stage: number; label: string; status: string; date: string | null }>;
}

const TABS = ['Profile', 'Addresses', 'Orders', 'Support'] as const;
type Tab = typeof TABS[number];

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'order-status-pending', AWAITING_PAYMENT: 'order-status-pending',
  PAYMENT_RECEIVED: 'order-status-processing', PROCESSING: 'order-status-processing',
  SHIPPED: 'order-status-shipped', DELIVERED: 'order-status-delivered',
  CANCELLED: 'order-status-cancelled', REFUNDED: 'order-status-cancelled',
};

export default function AccountContent() {
  const [tab, setTab] = useState<Tab>('Profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Profile edit state
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');

  // Address form
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editAddrId, setEditAddrId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({ label: '', firstName: '', lastName: '', street1: '', street2: '', city: '', state: '', postalCode: '', phone: '', isBilling: false, isShipping: true });

  // Support form
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportReason, setSupportReason] = useState('');
  const [supportType, setSupportType] = useState('request');

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = '/login?redirect=account';
      return;
    }
    loadProfile();
    loadAddresses();
    loadOrders();
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users/me`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditFirst(data.firstName || '');
        setEditLast(data.lastName || '');
        setEditPhone(data.phone || '');
        setSupportName(`${data.firstName || ''} ${data.lastName || ''}`.trim());
        setSupportEmail(data.email || '');
      }
    } catch { /* */ }
    setLoading(false);
  }, []);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users/me/addresses`, { headers: authHeaders() });
      if (res.ok) setAddresses(await res.json());
    } catch { /* */ }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/orders?limit=50`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch { /* */ }
  }, []);

  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  // Profile save
  const saveProfile = async () => {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ firstName: editFirst, lastName: editLast, phone: editPhone }),
    });
    if (res.ok) { loadProfile(); showMsg('Profile updated'); }
    else showMsg('Failed to update profile');
  };

  // Email change
  const changeEmail = async () => {
    if (!newEmail || !emailPw) return showMsg('Email and password required');
    const res = await fetch(`${API_BASE}/users/me/email`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ newEmail, password: emailPw }),
    });
    const data = await res.json();
    if (res.ok) { loadProfile(); setNewEmail(''); setEmailPw(''); showMsg('Email updated'); }
    else showMsg(data.message || 'Failed to change email');
  };

  // Addresses
  const openAddrForm = (addr?: Address) => {
    if (addr) {
      setEditAddrId(addr.id);
      setAddrForm({ label: addr.label || '', firstName: addr.firstName, lastName: addr.lastName, street1: addr.street1, street2: addr.street2 || '', city: addr.city, state: addr.state, postalCode: addr.postalCode, phone: addr.phone || '', isBilling: addr.isBilling, isShipping: addr.isShipping });
    } else {
      setEditAddrId(null);
      setAddrForm({ label: '', firstName: '', lastName: '', street1: '', street2: '', city: '', state: '', postalCode: '', phone: '', isBilling: false, isShipping: true });
    }
    setShowAddrForm(true);
  };

  const saveAddress = async () => {
    const url = editAddrId ? `${API_BASE}/users/me/addresses/${editAddrId}` : `${API_BASE}/users/me/addresses`;
    const method = editAddrId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(addrForm) });
    if (res.ok) { loadAddresses(); setShowAddrForm(false); showMsg(editAddrId ? 'Address updated' : 'Address added'); }
    else showMsg('Failed to save address');
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    const res = await fetch(`${API_BASE}/users/me/addresses/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) { loadAddresses(); showMsg('Address deleted'); }
  };

  const setDefault = async (id: string) => {
    const res = await fetch(`${API_BASE}/users/me/addresses/${id}/default`, { method: 'PUT', headers: authHeaders() });
    if (res.ok) { loadAddresses(); showMsg('Default address set'); }
  };

  // Reorder
  const reorder = async (orderId: string) => {
    const res = await fetch(`${API_BASE}/orders/${orderId}/reorder-items`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      // Store items for cart page to pick up
      localStorage.setItem('sbb_reorder', JSON.stringify(data.items));
      window.location.href = '/shop';
    } else showMsg('Could not load reorder items');
  };

  // Support callback
  const submitCallback = async () => {
    if (!supportPhone || !supportReason) return showMsg('Phone and reason are required');
    const res = await fetch(`${API_BASE}/support/callback`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ name: supportName, email: supportEmail, phone: supportPhone, reason: supportReason, type: supportType }),
    });
    if (res.ok) { showMsg('Callback request submitted — we will reach out shortly'); setSupportReason(''); setSupportPhone(''); }
    else showMsg('Failed to submit request');
  };

  if (loading) return <div className="dashboard-container"><div className="dash-loading">Loading...</div></div>;
  if (!profile) return <div className="dashboard-container"><div className="dash-empty"><p>Please log in to view your account.</p></div></div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>My Account</h1>
        <p>Welcome back, {profile.firstName || profile.email}</p>
      </div>

      {msg && <div style={{ background: 'var(--sage)', color: '#fff', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>{msg}</div>}

      <div className="dashboard-tabs">
        {TABS.map((t) => (
          <button key={t} className={`dashboard-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* ── PROFILE ── */}
      {tab === 'Profile' && (
        <div className="dashboard-panel">
          <h2>Personal Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="dash-form-group">
              <label>First Name</label>
              <input value={editFirst} onChange={(e) => setEditFirst(e.target.value)} />
            </div>
            <div className="dash-form-group">
              <label>Last Name</label>
              <input value={editLast} onChange={(e) => setEditLast(e.target.value)} />
            </div>
          </div>
          <div className="dash-form-group">
            <label>Phone</label>
            <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <button className="dash-btn dash-btn-primary" onClick={saveProfile}>Save Changes</button>

          <hr style={{ margin: '28px 0', border: 'none', borderTop: '1px solid var(--glass-border)' }} />

          <h2>Change Email</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7b8d', marginBottom: 12 }}>Current: {profile.email}</p>
          <div className="dash-form-group">
            <label>New Email</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          <div className="dash-form-group">
            <label>Current Password (required)</label>
            <input type="password" value={emailPw} onChange={(e) => setEmailPw(e.target.value)} />
          </div>
          <button className="dash-btn dash-btn-primary" onClick={changeEmail}>Update Email</button>

          <hr style={{ margin: '28px 0', border: 'none', borderTop: '1px solid var(--glass-border)' }} />

          <h2>Change Password</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7b8d' }}>Use the password reset flow to change your password.</p>
          <button className="dash-btn dash-btn-secondary" onClick={() => window.location.href = '/forgot-password'}>Reset Password</button>
        </div>
      )}

      {/* ── ADDRESSES ── */}
      {tab === 'Addresses' && (
        <div className="dashboard-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ marginBottom: 0 }}>My Addresses</h2>
            <button className="dash-btn dash-btn-primary" onClick={() => openAddrForm()}>+ Add Address</button>
          </div>

          {showAddrForm && (
            <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>{editAddrId ? 'Edit Address' : 'New Address'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="dash-form-group"><label>First Name</label><input value={addrForm.firstName} onChange={(e) => setAddrForm({ ...addrForm, firstName: e.target.value })} /></div>
                <div className="dash-form-group"><label>Last Name</label><input value={addrForm.lastName} onChange={(e) => setAddrForm({ ...addrForm, lastName: e.target.value })} /></div>
              </div>
              <div className="dash-form-group"><label>Street Address</label><input value={addrForm.street1} onChange={(e) => setAddrForm({ ...addrForm, street1: e.target.value })} /></div>
              <div className="dash-form-group"><label>Apt/Suite (optional)</label><input value={addrForm.street2} onChange={(e) => setAddrForm({ ...addrForm, street2: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                <div className="dash-form-group"><label>City</label><input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} /></div>
                <div className="dash-form-group"><label>State</label><input value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} /></div>
                <div className="dash-form-group"><label>ZIP</label><input value={addrForm.postalCode} onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })} /></div>
              </div>
              <div className="dash-form-group"><label>Phone (optional)</label><input value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <label style={{ fontSize: '0.85rem' }}><input type="checkbox" checked={addrForm.isShipping} onChange={(e) => setAddrForm({ ...addrForm, isShipping: e.target.checked })} /> Shipping</label>
                <label style={{ fontSize: '0.85rem' }}><input type="checkbox" checked={addrForm.isBilling} onChange={(e) => setAddrForm({ ...addrForm, isBilling: e.target.checked })} /> Billing</label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="dash-btn dash-btn-primary" onClick={saveAddress}>Save</button>
                <button className="dash-btn dash-btn-secondary" onClick={() => setShowAddrForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {addresses.length === 0 ? (
            <div className="dash-empty"><p>No addresses saved yet.</p></div>
          ) : (
            <div className="address-grid">
              {addresses.map((a) => (
                <div key={a.id} className={`address-card${a.isDefault ? ' is-default' : ''}`}>
                  {a.isDefault && <span className="default-badge">Default</span>}
                  <h4>{a.firstName} {a.lastName}</h4>
                  <p>{a.street1}</p>
                  {a.street2 && <p>{a.street2}</p>}
                  <p>{a.city}, {a.state} {a.postalCode}</p>
                  {a.phone && <p>{a.phone}</p>}
                  <div className="address-actions">
                    <button className="dash-btn dash-btn-sm dash-btn-secondary" onClick={() => openAddrForm(a)}>Edit</button>
                    {!a.isDefault && <button className="dash-btn dash-btn-sm dash-btn-secondary" onClick={() => setDefault(a.id)}>Set Default</button>}
                    <button className="dash-btn dash-btn-sm dash-btn-danger" onClick={() => deleteAddress(a.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ORDERS ── */}
      {tab === 'Orders' && (
        <div className="dashboard-panel">
          <h2>Order History</h2>
          {orders.length === 0 ? (
            <div className="dash-empty"><p>No orders yet.</p><a href="/shop" className="dash-btn dash-btn-primary" style={{ display: 'inline-block', marginTop: 12 }}>Shop Now</a></div>
          ) : (
            <div className="order-list">
              {orders.map((o) => (
                <div key={o.id} className="order-row" onClick={() => window.location.href = `/tracking?order=${o.id}`}>
                  <div className="order-info">
                    <h4>{o.orderNumber}</h4>
                    <p>{formatDate(o.createdAt)} — {o.items.length} item{o.items.length > 1 ? 's' : ''} — {formatCurrency(o.totalAmount)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`order-status ${STATUS_CLASS[o.status] || 'order-status-pending'}`}>{o.status.replace(/_/g, ' ')}</span>
                    <button className="dash-btn dash-btn-sm dash-btn-secondary" onClick={(e) => { e.stopPropagation(); reorder(o.id); }}>Reorder</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUPPORT ── */}
      {tab === 'Support' && (
        <div className="dashboard-panel">
          <h2>Request a Callback</h2>
          <p style={{ color: '#6b7b8d', fontSize: '0.9rem', marginBottom: 20 }}>Fill out the form below and our team will call you back.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="dash-form-group"><label>Name</label><input value={supportName} onChange={(e) => setSupportName(e.target.value)} /></div>
            <div className="dash-form-group"><label>Email</label><input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} /></div>
          </div>
          <div className="dash-form-group"><label>Phone Number</label><input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} placeholder="(555) 123-4567" /></div>
          <div className="dash-form-group">
            <label>Type</label>
            <select value={supportType} onChange={(e) => setSupportType(e.target.value)}>
              <option value="request">Request</option>
              <option value="complaint">Complaint</option>
              <option value="order-issue">Order Issue</option>
              <option value="general">General Inquiry</option>
            </select>
          </div>
          <div className="dash-form-group"><label>Reason for Contact</label><textarea rows={4} value={supportReason} onChange={(e) => setSupportReason(e.target.value)} placeholder="Please describe how we can help..." /></div>
          <button className="dash-btn dash-btn-primary" onClick={submitCallback}>Submit Request</button>
        </div>
      )}
    </div>
  );
}
