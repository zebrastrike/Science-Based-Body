'use client';

import { useEffect } from 'react';

/**
 * Peptide Library page interactivity:
 * - Category card selection and filtering
 * - Peptide card expansion (accordion-style)
 * - A-Z alphabetical view
 * - Mobile category nav
 * - Dynamic tag/bullet generation from data attributes
 */
export default function LibraryInteractivity() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const on = (el: Element | Document | Window | null, event: string, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean) => {
      if (!el) return;
      el.addEventListener(event, handler, options);
      cleanups.push(() => el.removeEventListener(event, handler, options));
    };

    const library = document.querySelector('.peptide-library');
    if (!library) return () => cleanups.forEach(fn => fn());

    const categoryView = library.querySelector('[data-library-category-view]') as HTMLElement | null;
    const peptideView = library.querySelector('[data-library-peptide-view]') as HTMLElement | null;
    const categoryCards = Array.from(library.querySelectorAll('[data-category-id]')) as HTMLElement[];
    const peptideCards = Array.from(library.querySelectorAll('[data-peptide-card]')) as HTMLElement[];
    const backButton = library.querySelector('[data-library-back]') as HTMLButtonElement | null;
    const activeName = library.querySelector('[data-active-category-name]') as HTMLElement | null;
    const activeDescription = library.querySelector('[data-active-category-description]') as HTMLElement | null;
    const activeIcon = library.querySelector('[data-active-category-icon]') as HTMLElement | null;
    const activeCount = library.querySelector('[data-active-category-count]') as HTMLElement | null;
    const activeHeader = library.querySelector('[data-active-category]') as HTMLElement | null;

    const parseCategories = (value?: string) => (value || '').split(',').map(s => s.trim()).filter(Boolean);

    // Build category map
    const categoryMap = new Map<string, { name: string; description: string; icon: string; accent: string; countEl?: HTMLElement | null }>();
    categoryCards.forEach(card => {
      const id = card.dataset.categoryId || '';
      if (!id) return;
      categoryMap.set(id, {
        name: card.dataset.categoryName || card.querySelector('.label')?.textContent?.trim() || id,
        description: card.dataset.categoryDescription || card.querySelector('.category-desc')?.textContent?.trim() || '',
        icon: card.dataset.categoryIcon || card.querySelector('.category-icon')?.textContent?.trim() || '',
        accent: card.dataset.categoryAccent || '',
        countEl: card.querySelector('[data-category-count]') as HTMLElement | null,
      });
    });

    // Count peptides per category
    const counts = new Map<string, number>();
    peptideCards.forEach(card => {
      parseCategories(card.dataset.categories).forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
    });

    categoryMap.forEach((data, id) => {
      if (data.countEl) data.countEl.textContent = `${counts.get(id) || 0} peptides`;
    });

    // Populate peptide card labels, tags, summary, bullets
    peptideCards.forEach(card => {
      const ids = parseCategories(card.dataset.categories);
      const label = card.querySelector('[data-peptide-category]') as HTMLElement | null;
      const tags = card.querySelector('[data-peptide-tags]') as HTMLElement | null;
      const summary = card.querySelector('[data-peptide-summary]') as HTMLElement | null;
      const bullets = card.querySelector('[data-peptide-bullets]') as HTMLUListElement | null;
      const subtitle = card.dataset.peptideSubtitle || '';
      const mechanism = card.dataset.peptideMechanism || '';

      if (label) {
        const primary = ids[0];
        const data = primary ? categoryMap.get(primary) : null;
        if (data) label.textContent = data.name;
      }

      if (tags) {
        tags.innerHTML = '';
        ids.forEach(id => {
          const data = categoryMap.get(id);
          if (!data) return;
          const tag = document.createElement('span');
          tag.className = 'peptide-tag';
          tag.textContent = data.name;
          tags.appendChild(tag);
        });
      }

      if (summary) {
        const suffix = 'Supplied for laboratory research and educational reference only.';
        summary.textContent = subtitle ? `${subtitle} ${suffix}` : suffix;
      }

      if (bullets) {
        bullets.innerHTML = '';
        const entries = [
          mechanism ? `Mechanism: ${mechanism}` : '',
          ids.length ? `Research focus: ${ids.map(id => categoryMap.get(id)?.name || id).join(', ')}` : '',
          'Research context: preclinical and analytical studies',
        ].filter(Boolean);
        entries.forEach(text => {
          const li = document.createElement('li');
          li.textContent = text;
          bullets.appendChild(li);
        });
      }
    });

    const collapseAll = () => {
      peptideCards.forEach(card => {
        card.classList.remove('is-expanded');
        const toggle = card.querySelector('[data-peptide-toggle]') as HTMLButtonElement | null;
        const details = card.querySelector('.peptide-details') as HTMLElement | null;
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
        if (details) details.hidden = true;
      });
    };

    const showCategory = (id: string) => {
      const data = categoryMap.get(id);
      if (!data) return;

      categoryCards.forEach(card => card.classList.toggle('is-selected', card.dataset.categoryId === id));
      if (categoryView) categoryView.classList.add('is-hidden');
      if (peptideView) peptideView.classList.remove('is-hidden');
      if (activeName) activeName.textContent = data.name;
      if (activeDescription) activeDescription.textContent = data.description;
      if (activeIcon) activeIcon.textContent = data.icon;
      if (activeCount) activeCount.textContent = `${counts.get(id) || 0} peptides`;
      if (activeHeader && data.accent) activeHeader.style.setProperty('--category-accent', data.accent);

      peptideCards.forEach(card => {
        const ids = parseCategories(card.dataset.categories);
        const match = ids.includes(id);
        card.classList.toggle('is-hidden', !match);
        if (match && data.accent) card.style.setProperty('--peptide-accent', data.accent);
        const cardLabel = card.querySelector('[data-peptide-category]') as HTMLElement | null;
        if (cardLabel) cardLabel.textContent = data.name;
      });

      collapseAll();
      library.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Category card clicks
    categoryCards.forEach(card => {
      on(card, 'click', () => { const id = card.dataset.categoryId; if (id) showCategory(id); });
    });

    // Back button
    if (backButton) {
      on(backButton, 'click', (e) => {
        e.preventDefault();
        if (peptideView) peptideView.classList.add('is-hidden');
        if (categoryView) categoryView.classList.remove('is-hidden');
        collapseAll();
        library.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // Peptide card toggle (accordion)
    peptideCards.forEach(card => {
      const toggle = card.querySelector('[data-peptide-toggle]') as HTMLButtonElement | null;
      const details = card.querySelector('.peptide-details') as HTMLElement | null;
      if (!toggle || !details) return;
      on(toggle, 'click', () => {
        const isExpanded = card.classList.contains('is-expanded');
        collapseAll();
        if (!isExpanded) {
          card.classList.add('is-expanded');
          toggle.setAttribute('aria-expanded', 'true');
          details.hidden = false;
        }
      });
    });

    // Library mobile category nav
    const libNav = document.getElementById('library-mobile-nav');
    if (libNav) {
      const btns = libNav.querySelectorAll('[data-lib-nav]');
      btns.forEach(btn => {
        on(btn, 'click', (e) => {
          const catId = btn.getAttribute('data-lib-nav');
          if (catId === 'all') {
            const libSection = document.getElementById('library');
            if (libSection) libSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            btns.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            return;
          }
          e.preventDefault();
          const targetCard = document.querySelector(`[data-category-id="${catId}"]`) as HTMLElement;
          if (targetCard) {
            targetCard.click();
            setTimeout(() => targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
          }
          btns.forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
        });
      });
    }

    return () => cleanups.forEach(fn => fn());
  }, []);

  return null;
}
