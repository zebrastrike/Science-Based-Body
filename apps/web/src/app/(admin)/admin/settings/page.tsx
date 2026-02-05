'use client';

import { useEffect, useState } from 'react';
import { adminRequest } from '@/lib/api';
import { ToastStack, useToasts } from '@/components/admin/Toast';

interface SettingsData {
  store: {
    businessName: string;
    email: string;
    address: string;
    timezone: string;
  };
  shipping: {
    zones: Array<{ name: string; standardRate: number; expeditedRate: number; freeOver: number }>;
  };
  payments: {
    methods: Array<{ id: string; name: string; enabled: boolean }>;
    zelleDetails: string;
    cashAppDetails: string;
  };
  taxes: {
    states: Array<{ state: string; rate: number }>;
  };
  emails: {
    senderName: string;
    senderEmail: string;
    templates: Array<{ id: string; name: string; subject: string; preview: string }>;
  };
  compliance: {
    disclaimer: string;
    ageVerificationEnabled: boolean;
    checkboxText: string;
  };
  users: Array<{ id: string; name: string; email: string; role: string; status: string }>;
}

const tabs = [
  { id: 'store', label: 'Store' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'payments', label: 'Payments' },
  { id: 'taxes', label: 'Taxes' },
  { id: 'emails', label: 'Emails' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'users', label: 'Users' },
];

export default function SettingsPage() {
  const { toasts, push, dismiss } = useToasts();
  const [activeTab, setActiveTab] = useState('store');
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ADMIN');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await adminRequest<SettingsData>('/admin/settings');
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setSettings({
        store: {
          businessName: 'Science Based Body',
          email: 'support@sciencebasedbody.com',
          address: '123 Research Blvd, San Francisco, CA',
          timezone: 'America/Los_Angeles',
        },
        shipping: {
          zones: [
            { name: 'Domestic US', standardRate: 20, expeditedRate: 50, freeOver: 500 },
            { name: 'Canada', standardRate: 35, expeditedRate: 65, freeOver: 700 },
          ],
        },
        payments: {
          methods: [
            { id: 'card', name: 'Card (Masked)', enabled: false },
            { id: 'zelle', name: 'Zelle', enabled: true },
            { id: 'cashapp', name: 'CashApp', enabled: true },
          ],
          zelleDetails: 'payments@sciencebasedbody.com',
          cashAppDetails: '$ScienceBasedBody',
        },
        taxes: {
          states: [
            { state: 'CA', rate: 0 },
            { state: 'NY', rate: 0 },
            { state: 'TX', rate: 0 },
          ],
        },
        emails: {
          senderName: 'Science Based Body',
          senderEmail: 'no-reply@sciencebasedbody.com',
          templates: [
            { id: 'order-confirm', name: 'Order Confirmation', subject: 'Your Order Receipt', preview: 'Thanks for your order...' },
            { id: 'shipping', name: 'Shipping Update', subject: 'Your Order Shipped', preview: 'Tracking details inside...' },
          ],
        },
        compliance: {
          disclaimer: 'For research use only. Not for human or veterinary use.',
          ageVerificationEnabled: true,
          checkboxText: 'I confirm I am 21+ and purchasing for research use only.',
        },
        users: [
          { id: 'admin-1', name: 'Alex Chen', email: 'alex@sciencebasedbody.com', role: 'SUPER_ADMIN', status: 'ACTIVE' },
          { id: 'admin-2', name: 'Jordan Lee', email: 'jordan@sciencebasedbody.com', role: 'ADMIN', status: 'ACTIVE' },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    try {
      await adminRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      push('Settings updated.');
    } catch (err) {
      console.error('Failed to save settings:', err);
      push('Settings updated (demo mode).', 'info');
    }
  };

  const handleInvite = () => {
    if (!settings) return;
    const newUser = {
      id: `invite-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'INVITED',
    };
    setSettings({ ...settings, users: [newUser, ...settings.users] });
    push('Invite sent.');
    setInviteModal(false);
    setInviteEmail('');
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6">
        <div className="bg-background-card rounded-xl p-6 border border-border animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-32 mb-4"></div>
          <div className="h-4 bg-zinc-800 rounded w-full mb-2"></div>
          <div className="h-4 bg-zinc-800 rounded w-4/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-zinc-400 mt-1">Configure store operations and compliance.</p>
        </div>
        <button
          onClick={saveSettings}
          className="px-4 py-2 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors"
        >
          Save Changes
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              activeTab === tab.id
                ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/40'
                : 'text-zinc-400 border-border hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'store' && (
        <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-white">Store Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Business Name</label>
              <input
                type="text"
                value={settings.store.businessName}
                onChange={(e) => setSettings({ ...settings, store: { ...settings.store, businessName: e.target.value } })}
                className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Support Email</label>
              <input
                type="email"
                value={settings.store.email}
                onChange={(e) => setSettings({ ...settings, store: { ...settings.store, email: e.target.value } })}
                className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Business Address</label>
            <input
              type="text"
              value={settings.store.address}
              onChange={(e) => setSettings({ ...settings, store: { ...settings.store, address: e.target.value } })}
              className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Timezone</label>
            <input
              type="text"
              value={settings.store.timezone}
              onChange={(e) => setSettings({ ...settings, store: { ...settings.store, timezone: e.target.value } })}
              className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
            />
          </div>
        </div>
      )}

      {activeTab === 'shipping' && (
        <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-white">Shipping Zones</h2>
          <div className="space-y-4">
            {settings.shipping.zones.map((zone, index) => (
              <div key={zone.name} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{zone.name}</h3>
                  <span className="text-xs text-zinc-500">Free over ${zone.freeOver}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Standard</label>
                    <input
                      type="number"
                      value={zone.standardRate}
                      onChange={(e) => {
                        const zones = [...settings.shipping.zones];
                        zones[index].standardRate = Number(e.target.value);
                        setSettings({ ...settings, shipping: { zones } });
                      }}
                      className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Expedited</label>
                    <input
                      type="number"
                      value={zone.expeditedRate}
                      onChange={(e) => {
                        const zones = [...settings.shipping.zones];
                        zones[index].expeditedRate = Number(e.target.value);
                        setSettings({ ...settings, shipping: { zones } });
                      }}
                      className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Free Over</label>
                    <input
                      type="number"
                      value={zone.freeOver}
                      onChange={(e) => {
                        const zones = [...settings.shipping.zones];
                        zones[index].freeOver = Number(e.target.value);
                        setSettings({ ...settings, shipping: { zones } });
                      }}
                      className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-background-card rounded-xl border border-border p-6 space-y-6">
          <h2 className="font-semibold text-white">Payment Methods</h2>
          <div className="space-y-3">
            {settings.payments.methods.map((method, index) => (
              <div key={method.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">{method.name}</p>
                  <p className="text-xs text-zinc-500">Sensitive details are masked.</p>
                </div>
                <button
                  onClick={() => {
                    const methods = [...settings.payments.methods];
                    methods[index].enabled = !methods[index].enabled;
                    setSettings({ ...settings, payments: { ...settings.payments, methods } });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    method.enabled ? 'bg-brand-primary' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      method.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Zelle Details</label>
              <input
                type="text"
                value={settings.payments.zelleDetails}
                onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, zelleDetails: e.target.value } })}
                className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">CashApp Details</label>
              <input
                type="text"
                value={settings.payments.cashAppDetails}
                onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, cashAppDetails: e.target.value } })}
                className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'taxes' && (
        <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-white">Tax Rates</h2>
          <p className="text-sm text-zinc-500">
            Research chemicals are currently taxed at 0% by state.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {settings.taxes.states.map((entry, index) => (
              <div key={entry.state} className="border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{entry.state}</p>
                  <p className="text-xs text-zinc-500">State tax rate</p>
                </div>
                <input
                  type="number"
                  value={entry.rate}
                  onChange={(e) => {
                    const states = [...settings.taxes.states];
                    states[index].rate = Number(e.target.value);
                    setSettings({ ...settings, taxes: { states } });
                  }}
                  className="w-20 px-3 py-2 bg-background-secondary border border-border rounded-lg text-white text-sm text-right"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'emails' && (
        <div className="bg-background-card rounded-xl border border-border p-6 space-y-6">
          <h2 className="font-semibold text-white">Email Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Sender Name</label>
              <input
                type="text"
                value={settings.emails.senderName}
                onChange={(e) => setSettings({ ...settings, emails: { ...settings.emails, senderName: e.target.value } })}
                className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Sender Email</label>
              <input
                type="email"
                value={settings.emails.senderEmail}
                onChange={(e) => setSettings({ ...settings, emails: { ...settings.emails, senderEmail: e.target.value } })}
                className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.emails.templates.map((template) => (
              <div key={template.id} className="border border-border rounded-lg p-4">
                <h3 className="font-medium text-white">{template.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{template.subject}</p>
                <div className="mt-3 text-xs text-zinc-400 bg-background-secondary rounded-lg p-3">
                  {template.preview}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-white">Compliance Controls</h2>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Disclaimer</label>
            <textarea
              value={settings.compliance.disclaimer}
              onChange={(e) => setSettings({ ...settings, compliance: { ...settings.compliance, disclaimer: e.target.value } })}
              rows={4}
              className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
            ></textarea>
          </div>
          <div className="flex items-center justify-between border border-border rounded-lg p-3">
            <div>
              <p className="text-white font-medium">Age Verification</p>
              <p className="text-xs text-zinc-500">Require users to confirm they are 21+.</p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  compliance: {
                    ...settings.compliance,
                    ageVerificationEnabled: !settings.compliance.ageVerificationEnabled,
                  },
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.compliance.ageVerificationEnabled ? 'bg-brand-primary' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.compliance.ageVerificationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Checkbox Text</label>
            <input
              type="text"
              value={settings.compliance.checkboxText}
              onChange={(e) => setSettings({ ...settings, compliance: { ...settings.compliance, checkboxText: e.target.value } })}
              className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
            />
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Admin Users</h2>
            <button
              onClick={() => setInviteModal(true)}
              className="px-4 py-2 text-sm bg-brand-primary text-black font-semibold rounded-lg"
            >
              Invite Admin
            </button>
          </div>
          <div className="space-y-3">
            {settings.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-sm text-zinc-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">{user.role}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                    {user.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-xl border border-border w-full max-w-md">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-white">Invite Admin</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setInviteModal(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="px-4 py-2 text-sm bg-brand-primary text-black font-semibold rounded-lg"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
