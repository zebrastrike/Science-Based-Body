'use client';

import { useEffect } from 'react';

const ROLE_REDIRECTS: Record<string, string> = {
  SUPER_ADMIN: '/admin',
  ADMIN: '/admin',
  AFFILIATE: '/affiliate-dashboard',
  BRAND_PARTNER: '/partner-dashboard',
  CLIENT: '/account',
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Admin',
  ADMIN: 'Admin',
  AFFILIATE: 'Affiliate Partner',
  BRAND_PARTNER: 'Wholesale Partner',
  CLIENT: 'Customer',
};

export default function LoginInteractivity() {
  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL
      || (window.location.hostname === 'localhost' ? 'http://localhost:3001/api/v1' : 'https://api.sbbpeptides.com/api/v1');

    const authPanel = document.getElementById('auth-panel');
    const accountPanel = document.getElementById('account-panel');
    const pageTitle = document.getElementById('page-title');
    const authError = document.getElementById('auth-error');
    const loginContainer = document.getElementById('login-form-container');
    const registerContainer = document.getElementById('register-form-container');
    const forgotContainer = document.getElementById('forgot-form-container');

    if (!authPanel || !accountPanel || !authError) return;

    const showError = (msg: string) => {
      authError.textContent = msg;
      authError.style.display = 'block';
      authError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { authError.style.display = 'none'; }, 8000);
    };

    const setLoading = (btn: HTMLButtonElement, loading: boolean) => {
      btn.disabled = loading;
      btn.dataset.origText = btn.dataset.origText || btn.textContent || '';
      btn.textContent = loading ? 'Please wait...' : btn.dataset.origText;
    };

    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        authError.style.display = 'none';

        if ((tab as HTMLElement).dataset.tab === 'login') {
          if (loginContainer) loginContainer.style.display = '';
          if (registerContainer) registerContainer.style.display = 'none';
          if (forgotContainer) forgotContainer.style.display = 'none';
          if (pageTitle) pageTitle.textContent = 'Sign In';
        } else {
          if (loginContainer) loginContainer.style.display = 'none';
          if (registerContainer) registerContainer.style.display = '';
          if (forgotContainer) forgotContainer.style.display = 'none';
          if (pageTitle) pageTitle.textContent = 'Create Account';
        }
      });
    });

    // Forgot password toggle
    document.getElementById('forgot-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (loginContainer) loginContainer.style.display = 'none';
      if (forgotContainer) forgotContainer.style.display = '';
      if (pageTitle) pageTitle.textContent = 'Reset Password';
    });
    document.getElementById('back-to-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (forgotContainer) forgotContainer.style.display = 'none';
      if (loginContainer) loginContainer.style.display = '';
      if (pageTitle) pageTitle.textContent = 'Sign In';
    });

    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');

    const fetchProfile = async (token: string) => {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Token invalid');
      return res.json();
    };

    const showAccount = (user: any) => {
      authPanel.style.display = 'none';
      accountPanel.style.display = '';
      if (pageTitle) pageTitle.textContent = 'My Account';

      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Researcher';
      const nameEl = document.getElementById('account-name');
      if (nameEl) nameEl.textContent = `Welcome, ${name}`;
      const emailEl = document.getElementById('account-email');
      if (emailEl) emailEl.textContent = user.email || '';
      const phoneEl = document.getElementById('account-phone');
      if (phoneEl) phoneEl.textContent = user.phone || '—';
      const avatarEl = document.getElementById('account-avatar');
      if (avatarEl) avatarEl.textContent = (user.firstName || '?')[0].toUpperCase();

      const role = user.role || 'CLIENT';
      const badge = document.getElementById('account-role');
      if (badge) {
        badge.textContent = ROLE_LABELS[role] || role;
        badge.className = `account-role-badge role-${role.toLowerCase().replace('_', '-')}`;
      }

      const since = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';
      const sinceEl = document.getElementById('account-since');
      if (sinceEl) sinceEl.textContent = since;

      localStorage.setItem('sbb_user', JSON.stringify(user));
    };

    // Check existing session
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchProfile(token)
        .then(showAccount)
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('sbb_user');
        });
    }

    // Login
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn') as HTMLButtonElement;
      setLoading(btn, true);
      authError.style.display = 'none';

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: (document.getElementById('login-email') as HTMLInputElement).value.trim(),
            password: (document.getElementById('login-password') as HTMLInputElement).value,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        const user = await fetchProfile(data.accessToken);
        localStorage.setItem('sbb_user', JSON.stringify(user));

        if (redirectParam) {
          window.location.href = `/${redirectParam}`;
        } else {
          window.location.href = ROLE_REDIRECTS[user.role || 'CLIENT'] || '/shop';
        }
      } catch (err: any) {
        showError(err.message || 'Invalid email or password.');
      } finally {
        setLoading(btn, false);
      }
    });

    // Register
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('register-btn') as HTMLButtonElement;
      setLoading(btn, true);
      authError.style.display = 'none';

      const password = (document.getElementById('reg-password') as HTMLInputElement).value;
      const confirm = (document.getElementById('reg-confirm') as HTMLInputElement).value;
      if (password !== confirm) {
        showError('Passwords do not match.');
        setLoading(btn, false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: (document.getElementById('reg-firstName') as HTMLInputElement).value.trim(),
            lastName: (document.getElementById('reg-lastName') as HTMLInputElement).value.trim(),
            email: (document.getElementById('reg-email') as HTMLInputElement).value.trim(),
            phone: (document.getElementById('reg-phone') as HTMLInputElement).value.trim() || undefined,
            password,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        const user = await fetchProfile(data.accessToken);
        localStorage.setItem('sbb_user', JSON.stringify(user));
        window.location.href = redirectParam ? `/${redirectParam}` : '/shop';
      } catch (err: any) {
        showError(err.message || 'Could not create account. Please try again.');
      } finally {
        setLoading(btn, false);
      }
    });

    // Forgot password
    document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = (e.target as HTMLFormElement).querySelector('.auth-submit') as HTMLButtonElement;
      setLoading(btn, true);

      try {
        await fetch(`${API_BASE}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: (document.getElementById('forgot-email') as HTMLInputElement).value.trim() }),
        });
        if (forgotContainer) {
          forgotContainer.innerHTML = '<div style="text-align:center;padding:20px 0;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg><h3 style="margin:16px 0 8px;">Check Your Email</h3><p style="color:#666;font-size:0.9rem;">If an account exists for that email, we\'ve sent password reset instructions.</p><p style="margin-top:16px;"><a href="/login" class="text-link">Back to Sign In</a></p></div>';
        }
      } catch {
        showError('Something went wrong. Please try again.');
        setLoading(btn, false);
      }
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sbb_user');
      window.location.reload();
    });
  }, []);

  return null;
}
