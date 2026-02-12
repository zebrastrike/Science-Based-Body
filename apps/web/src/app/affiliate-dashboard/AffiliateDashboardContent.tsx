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

function getUserRole(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('sbb_user');
    return u ? JSON.parse(u).role : null;
  } catch { return null; }
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(v: string | number): string {
  return '$' + Number(v).toFixed(2);
}

/* ── Types ── */
interface AffiliateStats {
  referralCode: string; referralLink: string; legacyLink: string;
  commissionRate: number; isSalesAgent: boolean;
  totalClicks: number; totalOrders: number;
  totalRevenue: number; totalCommission: number; pendingPayout: number;
}

interface Address {
  id: string; label?: string; firstName: string; lastName: string;
  street1: string; street2?: string; city: string; state: string;
  postalCode: string; phone?: string; isDefault: boolean; isBilling: boolean; isShipping: boolean;
}

interface UserProfile {
  id: string; email: string; firstName: string; lastName: string; phone?: string; role: string;
}

interface Order {
  id: string; orderNumber: string; status: string; createdAt: string;
  totalAmount: string; items: Array<{ productName: string; quantity: number }>;
}

interface DocItem {
  id: string; title: string; description?: string; originalName: string;
  status: string; requiresSignature: boolean; signedAt?: string; createdAt: string;
}

interface CatalogProduct {
  id: string; name: string; slug: string; sku: string; category: string;
  shortDescription?: string; primaryImage?: string;
  variants: Array<{ id: string; name: string; strength?: string }>;
}

interface Referral {
  id: string; createdAt: string; orderId?: string; commission?: number;
}

const TABS = ['Overview', 'Referrals', 'Orders', 'Documents', 'Catalog', 'Profile', 'Support'] as const;
type Tab = typeof TABS[number];

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'order-status-pending', PROCESSING: 'order-status-processing',
  SHIPPED: 'order-status-shipped', DELIVERED: 'order-status-delivered',
  CANCELLED: 'order-status-cancelled',
};

export default function AffiliateDashboardContent() {
  const [tab, setTab] = useState<Tab>('Overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Profile edit
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');

  // Address form
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editAddrId, setEditAddrId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({ label: '', firstName: '', lastName: '', street1: '', street2: '', city: '', state: '', postalCode: '', phone: '', isBilling: false, isShipping: true });

  // Support
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportReason, setSupportReason] = useState('');
  const [supportType, setSupportType] = useState('request');

  // Sign modal
  const [signDocId, setSignDocId] = useState<string | null>(null);
  const [signName, setSignName] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { window.location.href = '/login?redirect=affiliate-dashboard'; return; }
    const role = getUserRole();
    if (role && role !== 'AFFILIATE' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      window.location.href = '/account'; return;
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    await Promise.all([loadProfile(), loadStats(), loadReferrals(), loadAddresses(), loadOrders(), loadDocuments(), loadCatalog()]);
    setLoading(false);
  };

  const loadProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/me`, { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        setProfile(d);
        setEditFirst(d.firstName || ''); setEditLast(d.lastName || ''); setEditPhone(d.phone || '');
        setSupportName(`${d.firstName || ''} ${d.lastName || ''}`.trim());
        setSupportEmail(d.email || '');
      }
    } catch { /* */ }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/affiliates/me/stats`, { headers: authHeaders() });
      if (res.ok) setStats(await res.json());
    } catch { /* */ }
  };

  const loadReferrals = async () => {
    try {
      const res = await fetch(`${API_BASE}/affiliates/me/referrals?limit=50`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setReferrals(d.referrals || []); }
    } catch { /* */ }
  };

  const loadAddresses = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/me/addresses`, { headers: authHeaders() });
      if (res.ok) setAddresses(await res.json());
    } catch { /* */ }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders?limit=50`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setOrders(d.orders || []); }
    } catch { /* */ }
  };

  const loadDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents/me`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setDocuments(d.documents || []); }
    } catch { /* */ }
  };

  const loadCatalog = async () => {
    try {
      const res = await fetch(`${API_BASE}/catalog/wholesale`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setCatalog(d.products || []); }
    } catch { /* */ }
  };

  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => showMsg('Copied!')).catch(() => showMsg('Failed to copy'));
  };

  const saveProfile = async () => {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ firstName: editFirst, lastName: editLast, phone: editPhone }),
    });
    if (res.ok) { loadProfile(); showMsg('Profile updated'); }
    else showMsg('Failed to update');
  };

  const changeEmail = async () => {
    if (!newEmail || !emailPw) return showMsg('Email and password required');
    const res = await fetch(`${API_BASE}/users/me/email`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ newEmail, password: emailPw }),
    });
    const data = await res.json();
    if (res.ok) { loadProfile(); setNewEmail(''); setEmailPw(''); showMsg('Email updated'); }
    else showMsg(data.message || 'Failed');
  };

  // Address CRUD
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
    const res = await fetch(url, { method: editAddrId ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(addrForm) });
    if (res.ok) { loadAddresses(); setShowAddrForm(false); showMsg('Saved'); }
    else showMsg('Failed');
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    await fetch(`${API_BASE}/users/me/addresses/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadAddresses();
  };

  const setDefault = async (id: string) => {
    await fetch(`${API_BASE}/users/me/addresses/${id}/default`, { method: 'PUT', headers: authHeaders() });
    loadAddresses();
  };

  // Documents
  const downloadDoc = (id: string) => {
    const token = localStorage.getItem('accessToken');
    window.open(`${API_BASE}/documents/${id}/download?token=${token}`, '_blank');
  };

  const signDocument = async () => {
    if (!signDocId || !signName) return showMsg('Please type your full name');
    const res = await fetch(`${API_BASE}/documents/${signDocId}/sign`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ fullName: signName }),
    });
    if (res.ok) { loadDocuments(); setSignDocId(null); setSignName(''); showMsg('Document signed'); }
    else { const d = await res.json(); showMsg(d.message || 'Failed to sign'); }
  };

  const reorder = async (orderId: string) => {
    const res = await fetch(`${API_BASE}/orders/${orderId}/reorder-items`, { headers: authHeaders() });
    if (res.ok) { const d = await res.json(); localStorage.setItem('sbb_reorder', JSON.stringify(d.items)); window.location.href = '/shop'; }
  };

  const submitCallback = async () => {
    if (!supportPhone || !supportReason) return showMsg('Phone and reason required');
    const res = await fetch(`${API_BASE}/support/callback`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ name: supportName, email: supportEmail, phone: supportPhone, reason: supportReason, type: supportType }),
    });
    if (res.ok) { showMsg('Request submitted'); setSupportReason(''); }
    else showMsg('Failed');
  };

  if (loading) return <div className="dashboard-container"><div className="dash-loading">Loading...</div></div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Affiliate Dashboard</h1>
        <p>Welcome back, {profile?.firstName || profile?.email || 'Affiliate'}</p>
      </div>

      {msg && <div style={{ background: 'var(--sage)', color: '#fff', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>{msg}</div>}

      <div className="dashboard-tabs">
        {TABS.map((t) => (
          <button key={t} className={`dashboard-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'Overview' && stats && (
        <div className="dashboard-panel">
          {stats.isSalesAgent && (
            <div className="sales-agent-badge">Sales Agent — {(stats.commissionRate * 100).toFixed(0)}% Commission</div>
          )}

          <div className="referral-link-box">
            <input readOnly value={stats.referralLink} onClick={(e) => (e.target as HTMLInputElement).select()} />
            <button className="dash-btn dash-btn-primary dash-btn-sm" onClick={() => copyToClipboard(stats.referralLink)}>Copy</button>
          </div>

          <div className="stat-cards">
            <div className="stat-card"><div className="stat-value">{stats.totalClicks}</div><div className="stat-label">Clicks</div></div>
            <div className="stat-card"><div className="stat-value">{stats.totalOrders}</div><div className="stat-label">Orders</div></div>
            <div className="stat-card"><div className="stat-value">{formatCurrency(stats.totalRevenue)}</div><div className="stat-label">Revenue</div></div>
            <div className="stat-card"><div className="stat-value">{formatCurrency(stats.totalCommission)}</div><div className="stat-label">Commission</div></div>
            <div className="stat-card"><div className="stat-value">{formatCurrency(stats.pendingPayout)}</div><div className="stat-label">Pending Payout</div></div>
          </div>
        </div>
      )}

      {/* ── REFERRALS ── */}
      {tab === 'Referrals' && (
        <div className="dashboard-panel">
          <h2>Referral History</h2>
          {referrals.length === 0 ? (
            <div className="dash-empty"><p>No referral conversions yet. Share your link to start earning!</p></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '0.82rem', color: '#6b7b8d' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '0.82rem', color: '#6b7b8d' }}>Order ID</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '0.82rem', color: '#6b7b8d' }}>Commission</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '10px 0', fontSize: '0.9rem' }}>{formatDate(r.createdAt)}</td>
                    <td style={{ padding: '10px 0', fontSize: '0.9rem' }}>{r.orderId ? r.orderId.slice(0, 12) + '...' : '—'}</td>
                    <td style={{ padding: '10px 0', fontSize: '0.9rem', textAlign: 'right' }}>{r.commission ? formatCurrency(r.commission) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── ORDERS ── */}
      {tab === 'Orders' && (
        <div className="dashboard-panel">
          <h2>Order History</h2>
          {orders.length === 0 ? (
            <div className="dash-empty"><p>No orders yet.</p></div>
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

      {/* ── DOCUMENTS ── */}
      {tab === 'Documents' && (
        <div className="dashboard-panel">
          <h2>Document Hub</h2>
          {documents.length === 0 ? (
            <div className="dash-empty"><p>No documents assigned yet.</p></div>
          ) : (
            <div className="doc-list">
              {documents.map((doc) => (
                <div key={doc.id} className="doc-card">
                  <div className="doc-info">
                    <h4>{doc.title}</h4>
                    <p>{doc.description || doc.originalName} — {formatDate(doc.createdAt)}</p>
                  </div>
                  <span className={`doc-status ${doc.status === 'SIGNED' ? 'signed' : doc.status === 'EXPIRED' ? 'expired' : 'pending'}`}>
                    {doc.status === 'SIGNED' ? `Signed ${formatDate(doc.signedAt || null)}` : doc.status.replace(/_/g, ' ')}
                  </span>
                  <div className="doc-actions">
                    <button className="dash-btn dash-btn-sm dash-btn-secondary" onClick={() => downloadDoc(doc.id)}>Download</button>
                    {doc.requiresSignature && doc.status === 'PENDING_SIGNATURE' && (
                      <button className="dash-btn dash-btn-sm dash-btn-primary" onClick={() => { setSignDocId(doc.id); setSignName(''); }}>Sign</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sign Modal */}
          {signDocId && (
            <div className="sign-modal-overlay" onClick={() => setSignDocId(null)}>
              <div className="sign-modal" onClick={(e) => e.stopPropagation()}>
                <h3>E-Sign Document</h3>
                <p>By typing your full legal name below and clicking Sign, you are electronically signing this document. Your name, IP address, and timestamp will be recorded.</p>
                <div className="dash-form-group">
                  <label>Full Legal Name</label>
                  <input value={signName} onChange={(e) => setSignName(e.target.value)} placeholder="Type your full name" autoFocus />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="dash-btn dash-btn-primary" onClick={signDocument}>Sign Document</button>
                  <button className="dash-btn dash-btn-secondary" onClick={() => setSignDocId(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CATALOG ── */}
      {tab === 'Catalog' && (
        <div className="dashboard-panel">
          <h2>Wholesale Product Catalog</h2>
          <p style={{ color: '#6b7b8d', fontSize: '0.85rem', marginBottom: 20 }}>
            Browse our full product catalog. For pricing, contact your account manager.
          </p>
          {catalog.length === 0 ? (
            <div className="dash-empty"><p>Catalog loading...</p></div>
          ) : (
            <div className="catalog-grid">
              {catalog.map((p) => (
                <div key={p.id} className="catalog-item">
                  {p.primaryImage && <img src={p.primaryImage} alt={p.name} />}
                  <h4>{p.name}</h4>
                  <div className="catalog-sku">{p.sku}</div>
                  {p.variants.length > 0 && (
                    <div className="catalog-variants">{p.variants.map((v) => v.name).join(', ')}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE ── */}
      {tab === 'Profile' && (
        <div className="dashboard-panel">
          <h2>Personal Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="dash-form-group"><label>First Name</label><input value={editFirst} onChange={(e) => setEditFirst(e.target.value)} /></div>
            <div className="dash-form-group"><label>Last Name</label><input value={editLast} onChange={(e) => setEditLast(e.target.value)} /></div>
          </div>
          <div className="dash-form-group"><label>Phone</label><input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
          <button className="dash-btn dash-btn-primary" onClick={saveProfile}>Save Changes</button>

          <hr style={{ margin: '28px 0', border: 'none', borderTop: '1px solid var(--glass-border)' }} />
          <h2>Change Email</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7b8d', marginBottom: 12 }}>Current: {profile?.email}</p>
          <div className="dash-form-group"><label>New Email</label><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
          <div className="dash-form-group"><label>Current Password</label><input type="password" value={emailPw} onChange={(e) => setEmailPw(e.target.value)} /></div>
          <button className="dash-btn dash-btn-primary" onClick={changeEmail}>Update Email</button>

          <hr style={{ margin: '28px 0', border: 'none', borderTop: '1px solid var(--glass-border)' }} />
          <h2>Addresses</h2>
          <button className="dash-btn dash-btn-secondary" onClick={() => openAddrForm()} style={{ marginBottom: 16 }}>+ Add Address</button>

          {showAddrForm && (
            <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="dash-form-group"><label>First Name</label><input value={addrForm.firstName} onChange={(e) => setAddrForm({ ...addrForm, firstName: e.target.value })} /></div>
                <div className="dash-form-group"><label>Last Name</label><input value={addrForm.lastName} onChange={(e) => setAddrForm({ ...addrForm, lastName: e.target.value })} /></div>
              </div>
              <div className="dash-form-group"><label>Street</label><input value={addrForm.street1} onChange={(e) => setAddrForm({ ...addrForm, street1: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                <div className="dash-form-group"><label>City</label><input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} /></div>
                <div className="dash-form-group"><label>State</label><input value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} /></div>
                <div className="dash-form-group"><label>ZIP</label><input value={addrForm.postalCode} onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="dash-btn dash-btn-primary" onClick={saveAddress}>Save</button>
                <button className="dash-btn dash-btn-secondary" onClick={() => setShowAddrForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="address-grid">
            {addresses.map((a) => (
              <div key={a.id} className={`address-card${a.isDefault ? ' is-default' : ''}`}>
                {a.isDefault && <span className="default-badge">Default</span>}
                <h4>{a.firstName} {a.lastName}</h4>
                <p>{a.street1}</p>
                <p>{a.city}, {a.state} {a.postalCode}</p>
                <div className="address-actions">
                  <button className="dash-btn dash-btn-sm dash-btn-secondary" onClick={() => openAddrForm(a)}>Edit</button>
                  {!a.isDefault && <button className="dash-btn dash-btn-sm dash-btn-secondary" onClick={() => setDefault(a.id)}>Default</button>}
                  <button className="dash-btn dash-btn-sm dash-btn-danger" onClick={() => deleteAddress(a.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          <hr style={{ margin: '28px 0', border: 'none', borderTop: '1px solid var(--glass-border)' }} />
          <button className="dash-btn dash-btn-secondary" onClick={() => window.location.href = '/forgot-password'}>Reset Password</button>
        </div>
      )}

      {/* ── SUPPORT ── */}
      {tab === 'Support' && (
        <div className="dashboard-panel">
          <h2>Request a Callback</h2>
          <p style={{ color: '#6b7b8d', fontSize: '0.9rem', marginBottom: 20 }}>Our team will reach out to you.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="dash-form-group"><label>Name</label><input value={supportName} onChange={(e) => setSupportName(e.target.value)} /></div>
            <div className="dash-form-group"><label>Email</label><input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} /></div>
          </div>
          <div className="dash-form-group"><label>Phone</label><input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} /></div>
          <div className="dash-form-group">
            <label>Type</label>
            <select value={supportType} onChange={(e) => setSupportType(e.target.value)}>
              <option value="request">Request</option>
              <option value="complaint">Complaint</option>
              <option value="order-issue">Order Issue</option>
              <option value="general">General</option>
            </select>
          </div>
          <div className="dash-form-group"><label>Reason</label><textarea rows={4} value={supportReason} onChange={(e) => setSupportReason(e.target.value)} /></div>
          <button className="dash-btn dash-btn-primary" onClick={submitCallback}>Submit</button>
        </div>
      )}
    </div>
  );
}
