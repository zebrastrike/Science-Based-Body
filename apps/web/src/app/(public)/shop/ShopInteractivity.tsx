'use client';

import { useEffect } from 'react';

/**
 * Shop-page-specific interactivity:
 * - Sticky shop nav with active section highlighting
 * - Smooth scroll for nav links
 * - Inline search filter
 * - Floating mobile category navigator (FAB)
 */
export default function ShopInteractivity() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const on = (el: Element | Window | null, event: string, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean) => {
      if (!el) return;
      el.addEventListener(event, handler, options);
      cleanups.push(() => el.removeEventListener(event, handler, options));
    };

    // ==============================
    // SHOP NAV
    // ==============================
    const shopNav = document.getElementById('shop-nav');
    if (shopNav) {
      const navLinks = shopNav.querySelectorAll('.shop-nav-link');
      const sections: Array<{ link: Element; section: HTMLElement; id: string }> = [];

      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href?.startsWith('#')) {
          const section = document.querySelector(href) as HTMLElement;
          if (section) sections.push({ link, section, id: href.slice(1) });
        }
      });

      const updateActiveNav = () => {
        const scrollY = window.scrollY;
        const offset = 150;
        let activeId: string | null = null;

        for (let i = sections.length - 1; i >= 0; i--) {
          if (sections[i].section.offsetTop - offset <= scrollY) {
            activeId = sections[i].id;
            break;
          }
        }

        navLinks.forEach(link => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${activeId}`);
        });

        const activeLink = shopNav.querySelector('.shop-nav-link.is-active');
        if (activeLink) {
          const scrollContainer = shopNav.querySelector('.shop-nav-scroll');
          if (scrollContainer) {
            const linkRect = activeLink.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();
            if (linkRect.left < containerRect.left || linkRect.right > containerRect.right) {
              activeLink.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
          }
        }

        // Sidebar sync
        document.querySelectorAll('.shop-sidebar-link').forEach(link => {
          link.classList.toggle('is-active', link.getAttribute('data-section') === activeId);
        });
      };

      on(window, 'scroll', updateActiveNav, { passive: true });
      updateActiveNav();

      // Smooth scroll
      const allNavLinks = [...Array.from(navLinks), ...Array.from(document.querySelectorAll('.shop-sidebar-link'))];
      allNavLinks.forEach(link => {
        on(link, 'click', (e) => {
          const href = link.getAttribute('href');
          if (href?.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href) as HTMLElement;
            if (target) {
              window.scrollTo({ top: target.offsetTop - shopNav.offsetHeight - 20, behavior: 'smooth' });
            }
          }
        });
      });
    }

    // ==============================
    // INLINE SEARCH FILTER
    // ==============================
    const shopInput = document.getElementById('shop-search-input') as HTMLInputElement | null;
    if (shopInput) {
      let debounceTimer: ReturnType<typeof setTimeout>;
      on(shopInput, 'input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const q = shopInput.value.trim().toLowerCase();
          if (q.length < 2) {
            document.querySelectorAll('.product-card').forEach(c => (c as HTMLElement).style.display = '');
            document.querySelectorAll('section[id] .section-heading').forEach(h => (h as HTMLElement).style.display = '');
            return;
          }
          document.querySelectorAll('.product-card').forEach(card => {
            const name = card.querySelector('h3')?.textContent?.trim().toLowerCase() || '';
            (card as HTMLElement).style.display = name.includes(q) ? '' : 'none';
          });
        }, 250);
      });

      on(shopInput, 'keydown', ((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          shopInput.value = '';
          shopInput.blur();
          document.querySelectorAll('.product-card').forEach(c => (c as HTMLElement).style.display = '');
        }
      }) as EventListener);
    }

    // ==============================
    // FLOATING CATEGORY NAVIGATOR (Mobile)
    // ==============================
    const fab = document.getElementById('category-fab');
    const sheet = document.getElementById('category-sheet');
    const sheetOverlay = document.getElementById('category-sheet-overlay');

    if (fab && sheet && sheetOverlay) {
      const openSheet = () => { sheet.classList.add('is-open'); sheetOverlay.classList.add('is-visible'); document.body.classList.add('search-open'); };
      const closeSheet = () => { sheet.classList.remove('is-open'); sheetOverlay.classList.remove('is-visible'); document.body.classList.remove('search-open'); };

      on(fab, 'click', openSheet);
      on(sheetOverlay, 'click', closeSheet);

      sheet.querySelectorAll('.category-sheet-btn').forEach(btn => {
        on(btn, 'click', (e) => {
          e.preventDefault();
          const href = btn.getAttribute('href');
          if (href?.startsWith('#')) {
            const target = document.querySelector(href) as HTMLElement;
            if (target) {
              const navHeight = shopNav?.offsetHeight || 0;
              window.scrollTo({ top: target.offsetTop - navHeight - 20, behavior: 'smooth' });
            }
          }
          closeSheet();
        });
      });

      const syncSheetActive = () => {
        const activeHref = shopNav?.querySelector('.shop-nav-link.is-active')?.getAttribute('href') || null;
        sheet.querySelectorAll('.category-sheet-btn').forEach(btn => {
          btn.classList.toggle('is-active', btn.getAttribute('href') === activeHref);
        });
      };
      on(window, 'scroll', syncSheetActive, { passive: true });

      const toggleFab = () => { fab.classList.toggle('is-hidden', window.scrollY <= 300); };
      on(window, 'scroll', toggleFab, { passive: true });
      toggleFab();
    }

    return () => cleanups.forEach(fn => fn());
  }, []);

  return null;
}
