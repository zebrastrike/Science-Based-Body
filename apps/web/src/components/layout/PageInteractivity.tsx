'use client';

import { useEffect } from 'react';

/**
 * Handles page-specific interactive behaviors for legacy HTML content rendered via LegacyMainContent.
 * This bridges the gap between static HTML and React until pages are fully converted.
 *
 * Features:
 * - Accordion (FAQ, policy pages)
 * - Reveal animation stagger delays
 * - Variant selectors on product cards
 * - Add-to-cart buttons on product cards (via SBBCart global)
 */
export default function PageInteractivity() {
  useEffect(() => {
    document.body.classList.add('is-ready');

    const cleanups: Array<() => void> = [];
    const on = <T extends Element | Document | Window>(
      el: T | null,
      event: string,
      handler: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions | boolean,
    ) => {
      if (!el) return;
      el.addEventListener(event, handler, options);
      cleanups.push(() => el.removeEventListener(event, handler, options));
    };

    // Reveal animation stagger
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach((el, index) => {
      (el as HTMLElement).style.setProperty('--delay', `${index * 80}ms`);
    });

    // Accordion behavior (FAQ, policy pages)
    const accordionItems = document.querySelectorAll('.accordion-item');
    accordionItems.forEach(item => {
      const trigger = item.querySelector('.accordion-trigger');
      if (!trigger) return;
      const handler = () => {
        const isOpen = item.classList.contains('is-open');
        accordionItems.forEach(panel => panel.classList.remove('is-open'));
        if (!isOpen) item.classList.add('is-open');
      };
      on(trigger, 'click', handler);
    });

    // COA Modal
    const modal = document.getElementById('coa-modal');
    if (modal) {
      const openButtons = document.querySelectorAll('.modal-open');
      const closeButtons = modal.querySelectorAll('[data-modal-close], .modal-close');

      const openModal = () => { modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); };
      const closeModal = () => { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); };

      openButtons.forEach(btn => on(btn, 'click', openModal));
      closeButtons.forEach(btn => on(btn, 'click', closeModal));
      on(document, 'keydown', ((e: Event) => {
        if ((e as KeyboardEvent).key === 'Escape' && modal.classList.contains('is-open')) closeModal();
      }) as EventListener);
    }

    // Product card Add-to-Cart buttons (for shop/carousel pages)
    const ensureAddToCartButtons = () => {
      document.querySelectorAll('.product-card').forEach(card => {
        if (card.querySelector('.btn-add-cart')) return;
        const body = card.querySelector('.product-body') || card;
        const name = card.querySelector('h3')?.textContent?.trim() || 'Product';
        const priceText = card.querySelector('.price')?.textContent || '';
        const priceMatch = priceText.match(/[\d,.]+/);
        const price = priceMatch ? priceMatch[0].replace(/,/g, '') : '0';
        const img = card.querySelector('img')?.getAttribute('src') || '/images/products/vial.png';
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn-add-cart';
        button.dataset.addToCart = slug || 'product';
        button.dataset.productName = name;
        button.dataset.productPrice = price;
        button.dataset.productImage = img;
        button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg> Add to Cart';
        body.appendChild(button);
      });
    };

    ensureAddToCartButtons();

    // Wire up [data-add-to-cart] buttons via event delegation on document
    // This catches both static buttons AND dynamically created ones (e.g. carousel)
    const atcHandler = (event: Event) => {
      const target = (event.target as Element)?.closest('[data-add-to-cart]') as HTMLElement | null;
      if (!target) return;
      event.preventDefault();
      const cart = (window as any).SBBCart;
      if (cart?.add) {
        cart.add({
          id: target.dataset.productId || target.dataset.addToCart,
          name: target.dataset.productName || 'Product',
          variant: target.dataset.productVariant || '',
          price: target.dataset.productPrice || 0,
          quantity: parseInt(target.dataset.productQty || '1', 10) || 1,
          image: target.dataset.productImage || '/images/products/vial.png',
        });
      }
    };
    on(document, 'click', atcHandler);

    // Variant selectors
    document.querySelectorAll('.variant-select').forEach(select => {
      const handler = () => {
        const el = select as HTMLSelectElement;
        const option = el.options[el.selectedIndex];
        const card = el.closest('.product-card');
        if (!card || !option) return;
        const priceEl = card.querySelector('.price');
        const button = card.querySelector('[data-add-to-cart]') as HTMLElement | null;
        if (priceEl && option.dataset.price) {
          priceEl.textContent = `$${parseFloat(option.dataset.price).toFixed(2)}`;
        }
        if (button) {
          if (option.dataset.price) button.dataset.productPrice = option.dataset.price;
          if (option.dataset.variantId) button.dataset.productVariant = option.value;
        }
      };
      on(select, 'change', handler);
    });

    // ============================================
    // AFFILIATE & PARTNER FORM SUBMISSIONS
    // ============================================
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.sbbpeptides.com/api/v1';

    const showFormFeedback = (form: HTMLFormElement, message: string, isError: boolean) => {
      const existing = form.querySelector('.form-feedback');
      if (existing) existing.remove();
      const div = document.createElement('div');
      div.className = 'form-feedback' + (isError ? ' form-feedback-error' : ' form-feedback-success');
      div.textContent = message;
      div.style.cssText = 'padding:12px 16px;margin:12px 0;border-radius:8px;font-size:14px;' +
        (isError ? 'background:#fce4ec;color:#c62828;border:1px solid #ef9a9a;' : 'background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;');
      form.prepend(div);
      div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    // Affiliate form
    const affiliateForm = document.getElementById('affiliate-form') as HTMLFormElement | null;
    if (affiliateForm) {
      const handler = (e: Event) => {
        e.preventDefault();
        const btn = affiliateForm.querySelector('button[type="submit"]') as HTMLButtonElement;
        const originalText = btn.textContent || '';
        btn.textContent = 'Submitting...';
        btn.disabled = true;

        const linksText = (document.getElementById('affiliate-links') as HTMLTextAreaElement)?.value || '';
        const socialLinks: Record<string, string> = {};
        linksText.split(/[\n,]+/).forEach(line => {
          line = line.trim();
          if (!line) return;
          if (line.includes('instagram') || line.startsWith('@')) socialLinks.instagram = line;
          else if (line.includes('youtube')) socialLinks.youtube = line;
          else if (line.includes('tiktok')) socialLinks.tiktok = line;
          else if (line.includes('twitter') || line.includes('x.com')) socialLinks.twitter = line;
          else socialLinks.other = (socialLinks.other ? socialLinks.other + ', ' : '') + line;
        });

        const formData = new FormData();
        formData.append('fullName', (document.getElementById('affiliate-name') as HTMLInputElement)?.value || '');
        formData.append('email', (document.getElementById('affiliate-email') as HTMLInputElement)?.value || '');
        formData.append('phone', (document.getElementById('affiliate-phone') as HTMLInputElement)?.value || '');
        formData.append('primaryPlatform', (document.getElementById('affiliate-platform') as HTMLSelectElement)?.value || '');
        formData.append('socialLinks', JSON.stringify(socialLinks));
        formData.append('audienceSize', (document.getElementById('affiliate-audience') as HTMLInputElement)?.value || '');
        formData.append('contentFocus', (document.getElementById('affiliate-focus') as HTMLInputElement)?.value || '');
        formData.append('whyPartner', (document.getElementById('affiliate-notes') as HTMLTextAreaElement)?.value || '');

        const salesAgentCheckbox = document.getElementById('affiliate-sales-agent') as HTMLInputElement | null;
        if (salesAgentCheckbox?.checked) formData.append('applyAsSalesAgent', 'true');

        const resumeInput = document.getElementById('affiliate-resume') as HTMLInputElement | null;
        if (resumeInput?.files?.[0]) formData.append('resume', resumeInput.files[0]);

        fetch(`${API_BASE}/affiliates/apply`, { method: 'POST', body: formData })
          .then(res => res.json().then(data => ({ ok: res.ok, data })))
          .then(result => {
            if (result.ok) {
              showFormFeedback(affiliateForm, 'Application submitted successfully! We will review and get back to you soon.', false);
              affiliateForm.reset();
            } else {
              showFormFeedback(affiliateForm, result.data.message || 'Something went wrong. Please try again.', true);
            }
          })
          .catch(() => showFormFeedback(affiliateForm, 'Network error. Please check your connection and try again.', true))
          .finally(() => { btn.textContent = originalText; btn.disabled = false; });
      };
      on(affiliateForm, 'submit', handler);
    }

    // Partner form
    const partnerForm = document.getElementById('partner-form') as HTMLFormElement | null;
    if (partnerForm) {
      const handler = (e: Event) => {
        e.preventDefault();
        const btn = partnerForm.querySelector('button[type="submit"]') as HTMLButtonElement;
        const originalText = btn.textContent || '';
        btn.textContent = 'Submitting...';
        btn.disabled = true;

        const formData = new FormData();
        formData.append('organizationName', (document.getElementById('org-name') as HTMLInputElement)?.value || '');
        formData.append('contactName', (document.getElementById('contact-name') as HTMLInputElement)?.value || '');
        formData.append('email', (document.getElementById('contact-email') as HTMLInputElement)?.value || '');
        formData.append('phone', (document.getElementById('contact-phone') as HTMLInputElement)?.value || '');
        formData.append('orgType', (document.getElementById('org-type') as HTMLSelectElement)?.value || '');
        formData.append('website', (document.getElementById('org-website') as HTMLInputElement)?.value || '');
        formData.append('location', (document.getElementById('org-location') as HTMLInputElement)?.value || '');
        formData.append('partnershipFocus', (document.getElementById('partner-interest') as HTMLSelectElement)?.value || '');
        formData.append('partnershipOverview', (document.getElementById('partner-notes') as HTMLTextAreaElement)?.value || '');

        const docsInput = document.getElementById('partner-documents') as HTMLInputElement | null;
        if (docsInput?.files) {
          for (let i = 0; i < docsInput.files.length; i++) {
            formData.append('documents', docsInput.files[i]);
          }
        }

        fetch(`${API_BASE}/partners/apply`, { method: 'POST', body: formData })
          .then(res => res.json().then(data => ({ ok: res.ok, data })))
          .then(result => {
            if (result.ok) {
              showFormFeedback(partnerForm, 'Partnership inquiry submitted! Our team will review and reach out shortly.', false);
              partnerForm.reset();
            } else {
              showFormFeedback(partnerForm, result.data.message || 'Something went wrong. Please try again.', true);
            }
          })
          .catch(() => showFormFeedback(partnerForm, 'Network error. Please check your connection and try again.', true))
          .finally(() => { btn.textContent = originalText; btn.disabled = false; });
      };
      on(partnerForm, 'submit', handler);
    }

    return () => {
      cleanups.forEach(fn => fn());
    };
  }, []);

  return null;
}
