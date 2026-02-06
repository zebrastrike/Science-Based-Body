'use client';

import { useEffect } from 'react';

type CartItem = {
  id: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  image?: string;
};

type CartProductInput = {
  id?: string;
  name?: string;
  variant?: string;
  price?: string | number;
  quantity?: number;
  image?: string;
};

export default function LegacyScripts() {
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

    // ============================================
    // MOBILE NAVIGATION (HAMBURGER MENU)
    // ============================================
    const menuToggle = document.querySelector('.menu-toggle');
    const siteNav = document.querySelector('.site-nav');

    if (menuToggle && siteNav) {
      let navOverlay = document.querySelector('.nav-overlay');
      if (!navOverlay) {
        navOverlay = document.createElement('div');
        navOverlay.className = 'nav-overlay';
        document.body.appendChild(navOverlay);
        cleanups.push(() => navOverlay?.remove());
      }

      const closeMenu = () => {
        menuToggle.setAttribute('aria-expanded', 'false');
        siteNav.classList.remove('is-open');
        navOverlay?.classList.remove('is-visible');
        document.body.classList.remove('menu-open');
      };

      const openMenu = () => {
        menuToggle.setAttribute('aria-expanded', 'true');
        siteNav.classList.add('is-open');
        navOverlay?.classList.add('is-visible');
        document.body.classList.add('menu-open');
      };

      const toggleMenu = () => {
        const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
        if (isOpen) closeMenu(); else openMenu();
      };

      on(menuToggle, 'click', toggleMenu);
      on(navOverlay, 'click', closeMenu);

      siteNav.querySelectorAll('.nav-link').forEach((link) => {
        on(link, 'click', () => setTimeout(closeMenu, 100));
      });

      on(document, 'keydown', ((e: Event) => {
        if ((e as KeyboardEvent).key === 'Escape' && siteNav.classList.contains('is-open')) {
          closeMenu();
        }
      }) as EventListener);

      let resizeTimer: ReturnType<typeof setTimeout>;
      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (window.innerWidth > 768 && siteNav.classList.contains('is-open')) {
            closeMenu();
          }
        }, 100);
      };
      on(window, 'resize', handleResize);
    }

    // ============================================
    // SHOPPING CART MODULE
    // ============================================
    const storageKey = 'sbb_cart';
    let items: CartItem[] = [];

    const load = () => {
      try {
        items = JSON.parse(localStorage.getItem(storageKey) || '[]');
      } catch {
        items = [];
      }
    };

    const getItemCount = () => items.reduce((sum, item) => sum + item.quantity, 0);
    const getSubtotal = () => items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const updateBadge = () => {
      const badges = document.querySelectorAll('.cart-badge');
      const count = getItemCount();
      badges.forEach((badge) => {
        badge.textContent = String(count);
        badge.classList.toggle('is-hidden', count === 0);
      });
    };

    const renderDrawer = () => {
      const itemsContainer = document.getElementById('cart-items');
      const subtotalEl = document.getElementById('cart-subtotal');
      const emptyMsg = document.getElementById('cart-empty');
      const checkoutBtn = document.getElementById('cart-checkout-btn');

      if (!itemsContainer) return;

      if (items.length === 0) {
        itemsContainer.innerHTML = '';
        if (emptyMsg) emptyMsg.classList.remove('is-hidden');
        if (checkoutBtn) checkoutBtn.classList.add('is-hidden');
      } else {
        if (emptyMsg) emptyMsg.classList.add('is-hidden');
        if (checkoutBtn) checkoutBtn.classList.remove('is-hidden');

        itemsContainer.innerHTML = items
          .map(
            (item, index) => `
          <div class="cart-item" data-index="${index}">
            <img src="${item.image || '/images/products/vial.png'}" alt="${item.name}" class="cart-item-image" />
            <div class="cart-item-details">
              <h4 class="cart-item-name">${item.name}</h4>
              ${item.variant ? `<span class="cart-item-variant">${item.variant}</span>` : ''}
              <span class="cart-item-price">$${item.price.toFixed(2)}</span>
            </div>
            <div class="cart-item-actions">
              <div class="cart-item-qty">
                <button type="button" class="qty-btn qty-minus" data-index="${index}">-</button>
                <span class="qty-value">${item.quantity}</span>
                <button type="button" class="qty-btn qty-plus" data-index="${index}">+</button>
              </div>
              <button type="button" class="cart-item-remove" data-index="${index}" aria-label="Remove item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        `,
          )
          .join('');
      }

      if (subtotalEl) {
        subtotalEl.textContent = `$${getSubtotal().toFixed(2)}`;
      }
    };

    const openDrawer = () => {
      const drawer = document.getElementById('cart-drawer');
      const overlay = document.getElementById('cart-overlay');
      if (drawer) {
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
      }
      if (overlay) overlay.classList.add('is-visible');
      document.body.classList.add('cart-open');
    };

    const closeDrawer = () => {
      const drawer = document.getElementById('cart-drawer');
      const overlay = document.getElementById('cart-overlay');
      if (drawer) {
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
      }
      if (overlay) overlay.classList.remove('is-visible');
      document.body.classList.remove('cart-open');
    };

    const showNotification = (message: string) => {
      let toast = document.getElementById('cart-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cart-toast';
        toast.className = 'cart-toast';
        document.body.appendChild(toast);
      }

      toast.textContent = message;
      toast.classList.add('is-visible');

      window.setTimeout(() => {
        toast?.classList.remove('is-visible');
      }, 2500);
    };

    const save = () => {
      localStorage.setItem(storageKey, JSON.stringify(items));
      updateBadge();
      renderDrawer();
    };

    const add = (product: CartProductInput) => {
      const id = product.id || 'product';
      const name = product.name || 'Product';
      const variant = product.variant || '';
      const price = parseFloat(String(product.price ?? 0)) || 0;
      const quantity = product.quantity || 1;
      const image = product.image || '/images/products/vial.png';

      const existingIndex = items.findIndex(
        (item) => item.id === id && item.variant === variant,
      );

      if (existingIndex > -1) {
        items[existingIndex].quantity += quantity;
      } else {
        items.push({ id, name, variant, price, quantity, image });
      }

      save();
      openDrawer();
      showNotification(`${name} added to cart`);
    };

    const remove = (index: number) => {
      items.splice(index, 1);
      save();
    };

    const updateQuantity = (index: number, quantity: number) => {
      if (quantity <= 0) {
        remove(index);
      } else {
        items[index].quantity = quantity;
        save();
      }
    };

    const clear = () => {
      items = [];
      save();
    };

    const bindCartEvents = () => {
      document.querySelectorAll('[data-cart-toggle]').forEach((btn) => {
        const handler = (event: Event) => {
          event.preventDefault();
          const drawer = document.getElementById('cart-drawer');
          if (drawer && drawer.classList.contains('is-open')) {
            closeDrawer();
          } else {
            openDrawer();
          }
        };
        on(btn, 'click', handler);
      });

      document.querySelectorAll('[data-cart-close]').forEach((btn) => {
        const handler = () => closeDrawer();
        on(btn, 'click', handler);
      });

      const overlay = document.getElementById('cart-overlay');
      on(overlay, 'click', () => closeDrawer());

      const escapeHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          const drawer = document.getElementById('cart-drawer');
          if (drawer && drawer.classList.contains('is-open')) {
            closeDrawer();
          }
        }
      };
      on(document, 'keydown', escapeHandler);

      const itemsContainer = document.getElementById('cart-items');
      if (itemsContainer) {
        const handler = (event: Event) => {
          const target = (event.target as Element | null)?.closest('button');
          if (!target) return;
          const index = parseInt((target as HTMLElement).dataset.index || '', 10);
          if (Number.isNaN(index)) return;

          if (target.classList.contains('qty-minus')) {
            updateQuantity(index, items[index].quantity - 1);
          } else if (target.classList.contains('qty-plus')) {
            updateQuantity(index, items[index].quantity + 1);
          } else if (target.classList.contains('cart-item-remove')) {
            remove(index);
          }
        };
        on(itemsContainer, 'click', handler);
      }

      const ensureAddToCartButtons = () => {
        document.querySelectorAll('.product-card').forEach((card) => {
          if (card.querySelector('.btn-add-cart')) return;
          const body = card.querySelector('.product-body') || card;
          const name = card.querySelector('h3')?.textContent?.trim() || 'Product';
          const priceText = card.querySelector('.price')?.textContent || '';
          const priceMatch = priceText.match(/[\d,.]+/);
          const price = priceMatch ? priceMatch[0].replace(/,/g, '') : '0';
          const img =
            card.querySelector('img')?.getAttribute('src') || '/images/products/vial.png';
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'btn-add-cart';
          button.dataset.addToCart = slug || 'product';
          button.dataset.productName = name;
          button.dataset.productPrice = price;
          button.dataset.productImage = img;
          button.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg> Add to Cart';
          body.appendChild(button);
        });
      };

      ensureAddToCartButtons();

      document.querySelectorAll('[data-add-to-cart]').forEach((btn) => {
        const handler = (event: Event) => {
          event.preventDefault();
          const element = btn as HTMLElement;
          add({
            id: element.dataset.productId || element.dataset.addToCart,
            name: element.dataset.productName || 'Product',
            variant: element.dataset.productVariant || '',
            price: element.dataset.productPrice || 0,
            quantity: parseInt(element.dataset.productQty || '1', 10) || 1,
            image: element.dataset.productImage || '/images/products/vial.png',
          });
        };
        on(btn, 'click', handler);
      });
    };

    load();
    updateBadge();
    renderDrawer();
    bindCartEvents();

    (window as any).SBBCart = {
      add,
      remove,
      updateQuantity,
      clear,
      openDrawer,
      closeDrawer,
      getItemCount,
      getSubtotal,
    };

    // ============================================
    // STICKY HEADER
    // ============================================
    const header = document.querySelector('.site-header');
    if (header) {
      const handleHeaderScroll = () => {
        if (window.scrollY > 50) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      };
      on(window, 'scroll', handleHeaderScroll, { passive: true });
      handleHeaderScroll();
    }

    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach((el, index) => {
      (el as HTMLElement).style.setProperty('--delay', `${index * 80}ms`);
    });

    const accordionItems = document.querySelectorAll('.accordion-item');
    accordionItems.forEach((item) => {
      const trigger = item.querySelector('.accordion-trigger');
      if (!trigger) return;
      const handler = () => {
        const isOpen = item.classList.contains('is-open');
        accordionItems.forEach((panel) => panel.classList.remove('is-open'));
        if (!isOpen) {
          item.classList.add('is-open');
        }
      };
      on(trigger, 'click', handler);
    });

    // ============================================
    // PEPTIDE LIBRARY
    // ============================================
    const library = document.querySelector('.peptide-library');
    if (library) {
      const categoryView = library.querySelector('[data-library-category-view]') as HTMLElement | null;
      const peptideView = library.querySelector('[data-library-peptide-view]') as HTMLElement | null;
      const categoryCards = Array.from(
        library.querySelectorAll('[data-category-id]'),
      ) as HTMLElement[];
      const peptideCards = Array.from(
        library.querySelectorAll('[data-peptide-card]'),
      ) as HTMLElement[];
      const backButton = library.querySelector('[data-library-back]') as HTMLButtonElement | null;
      const activeName = library.querySelector('[data-active-category-name]') as HTMLElement | null;
      const activeDescription = library.querySelector('[data-active-category-description]') as HTMLElement | null;
      const activeIcon = library.querySelector('[data-active-category-icon]') as HTMLElement | null;
      const activeCount = library.querySelector('[data-active-category-count]') as HTMLElement | null;
      const activeHeader = library.querySelector('[data-active-category]') as HTMLElement | null;

      const parseCategories = (value?: string) =>
        (value || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

      const categoryMap = new Map<
        string,
        { name: string; description: string; icon: string; accent: string; countEl?: HTMLElement | null }
      >();

      categoryCards.forEach((card) => {
        const id = card.dataset.categoryId || '';
        if (!id) return;
        categoryMap.set(id, {
          name: card.dataset.categoryName || card.querySelector('.label')?.textContent?.trim() || id,
          description:
            card.dataset.categoryDescription ||
            card.querySelector('.category-desc')?.textContent?.trim() ||
            '',
          icon: card.dataset.categoryIcon || card.querySelector('.category-icon')?.textContent?.trim() || '',
          accent: card.dataset.categoryAccent || '',
          countEl: card.querySelector('[data-category-count]') as HTMLElement | null,
        });
      });

      const counts = new Map<string, number>();
      peptideCards.forEach((card) => {
        const ids = parseCategories(card.dataset.categories);
        ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
      });

      categoryMap.forEach((data, id) => {
        if (data.countEl) {
          data.countEl.textContent = `${counts.get(id) || 0} peptides`;
        }
      });

      peptideCards.forEach((card) => {
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
          if (data) {
            label.textContent = data.name;
          }
        }

        if (tags) {
          tags.innerHTML = '';
          ids.forEach((id) => {
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
            ids.length
              ? `Research focus: ${ids.map((id) => categoryMap.get(id)?.name || id).join(', ')}`
              : '',
            'Research context: preclinical and analytical studies',
          ].filter(Boolean);
          entries.forEach((text) => {
            const li = document.createElement('li');
            li.textContent = text;
            bullets.appendChild(li);
          });
        }
      });

      const collapseAll = () => {
        peptideCards.forEach((card) => {
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

        categoryCards.forEach((card) => {
          card.classList.toggle('is-selected', card.dataset.categoryId === id);
        });

        if (categoryView) categoryView.classList.add('is-hidden');
        if (peptideView) peptideView.classList.remove('is-hidden');

        if (activeName) activeName.textContent = data.name;
        if (activeDescription) activeDescription.textContent = data.description;
        if (activeIcon) activeIcon.textContent = data.icon;
        if (activeCount) activeCount.textContent = `${counts.get(id) || 0} peptides`;
        if (activeHeader && data.accent) {
          activeHeader.style.setProperty('--category-accent', data.accent);
        }

        peptideCards.forEach((card) => {
          const ids = parseCategories(card.dataset.categories);
          const match = ids.includes(id);
          card.classList.toggle('is-hidden', !match);
          if (match && data.accent) {
            card.style.setProperty('--peptide-accent', data.accent);
          }
          const label = card.querySelector('[data-peptide-category]') as HTMLElement | null;
          if (label) {
            label.textContent = data.name;
          }
        });

        collapseAll();
        library.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };

      categoryCards.forEach((card) => {
        const handler = () => {
          const id = card.dataset.categoryId;
          if (id) showCategory(id);
        };
        on(card, 'click', handler);
      });

      if (backButton) {
        on(backButton, 'click', (event) => {
          event.preventDefault();
          if (peptideView) peptideView.classList.add('is-hidden');
          if (categoryView) categoryView.classList.remove('is-hidden');
          collapseAll();
          library.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }

      peptideCards.forEach((card) => {
        const toggle = card.querySelector('[data-peptide-toggle]') as HTMLButtonElement | null;
        const details = card.querySelector('.peptide-details') as HTMLElement | null;
        if (!toggle || !details) return;
        const handler = () => {
          const isExpanded = card.classList.contains('is-expanded');
          collapseAll();
          if (!isExpanded) {
            card.classList.add('is-expanded');
            toggle.setAttribute('aria-expanded', 'true');
            details.hidden = false;
          }
        };
        on(toggle, 'click', handler);
      });
    }

    // ============================================
    // BUBBLE FIELD ANIMATION
    // ============================================
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bubbleField = document.querySelector('.bubble-field');
    if (bubbleField) {
      const existing = bubbleField.querySelectorAll('.bubble');
      if (existing.length < 15) {
        for (let i = existing.length + 1; i <= 15; i += 1) {
          const bubble = document.createElement('span');
          bubble.className = `bubble bubble-${i}`;
          bubbleField.appendChild(bubble);
        }
      }
    }
    const bubbleEls = bubbleField
      ? Array.from(bubbleField.querySelectorAll('.bubble'))
      : [];

    if (!prefersReducedMotion && bubbleField && bubbleEls.length) {
      const obstacleSelectors = [
        '.hero-copy',
        '.section-heading',
        '.card',
        '.product-hero-copy',
        '.subscription-block',
        '.accordion-panel',
        '.modal-card',
      ];
      let obstacles: DOMRect[] = [];
      let needsRefresh = true;
      let lastRefresh = 0;

      const refreshObstacles = () => {
        const nodes = document.querySelectorAll(obstacleSelectors.join(','));
        obstacles = Array.from(nodes)
          .map((node) => node.getBoundingClientRect())
          .filter(
            (rect) =>
              rect.width > 0 &&
              rect.height > 0 &&
              rect.bottom > 0 &&
              rect.top < window.innerHeight,
          );
      };

      const scheduleRefresh = () => {
        needsRefresh = true;
      };

      on(window, 'resize', scheduleRefresh, { passive: true });
      on(window, 'scroll', scheduleRefresh, { passive: true });

      const bubbleState = bubbleEls.map((bubble) => {
        const size = (bubble as HTMLElement).offsetWidth;
        const startX = (bubble as HTMLElement).offsetLeft;
        const startY = (bubble as HTMLElement).offsetTop;
        (bubble as HTMLElement).style.left = '0px';
        (bubble as HTMLElement).style.top = '0px';
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.6 + Math.random() * 0.8;
        (bubble as HTMLElement).style.transform = `translate3d(${startX}px, ${startY}px, 0)`;
        return {
          el: bubble as HTMLElement,
          size,
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          seed: Math.random() * Math.PI * 2,
          isPopping: false,
        };
      });

      const popDuration = 420;
      const respawnBubble = (bubble: (typeof bubbleState)[number]) => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        bubble.x = Math.max(0, Math.random() * (width - bubble.size));
        bubble.y = Math.max(0, Math.random() * (height - bubble.size));
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.6 + Math.random() * 0.8;
        bubble.vx = Math.cos(angle) * speed;
        bubble.vy = Math.sin(angle) * speed;
        bubble.el.style.transform = `translate3d(${bubble.x}px, ${bubble.y}px, 0)`;
      };

      const popBubble = (bubble: (typeof bubbleState)[number]) => {
        if (bubble.isPopping) return;
        bubble.isPopping = true;
        bubble.el.classList.add('is-popping');
        window.setTimeout(() => {
          respawnBubble(bubble);
          bubble.el.classList.remove('is-popping');
          bubble.isPopping = false;
        }, popDuration);
      };

      const handleBubblePop = (event: PointerEvent) => {
        const target = event.target as HTMLElement | null;
        if (
          target &&
          target.closest(
            "button, a, input, textarea, select, label, [role='button'], .modal, .site-nav",
          )
        ) {
          return;
        }
        const x = event.clientX;
        const y = event.clientY;
        for (let i = 0; i < bubbleState.length; i += 1) {
          const bubble = bubbleState[i];
          if (bubble.isPopping) continue;
          const radius = bubble.size / 2;
          const cx = bubble.x + radius;
          const cy = bubble.y + radius;
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= radius * radius) {
            popBubble(bubble);
            break;
          }
        }
      };

      on(window, 'pointerdown', handleBubblePop, { passive: true });

      let lastTime = performance.now();
      let animationFrame = 0;
      const animateBubbles = (time: number) => {
        const delta = Math.min(40, time - lastTime);
        const dt = delta / 16.67;
        lastTime = time;

        if (needsRefresh || time - lastRefresh > 1200) {
          refreshObstacles();
          needsRefresh = false;
          lastRefresh = time;
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        const pad = 10;

        bubbleState.forEach((bubble) => {
          const driftX = Math.sin(time / 1400 + bubble.seed) * 0.3;
          const driftY = Math.cos(time / 1600 + bubble.seed) * 0.3;
          bubble.x += (bubble.vx + driftX) * dt;
          bubble.y += (bubble.vy + driftY) * dt;

          if (bubble.x <= 0) {
            bubble.x = 0;
            bubble.vx = Math.abs(bubble.vx);
          }
          if (bubble.x + bubble.size >= width) {
            bubble.x = width - bubble.size;
            bubble.vx = -Math.abs(bubble.vx);
          }
          if (bubble.y <= 0) {
            bubble.y = 0;
            bubble.vy = Math.abs(bubble.vy);
          }
          if (bubble.y + bubble.size >= height) {
            bubble.y = height - bubble.size;
            bubble.vy = -Math.abs(bubble.vy);
          }

          for (let i = 0; i < obstacles.length; i += 1) {
            const rect = obstacles[i];
            const left = rect.left - pad;
            const right = rect.right + pad;
            const top = rect.top - pad;
            const bottom = rect.bottom + pad;

            if (
              bubble.x + bubble.size > left &&
              bubble.x < right &&
              bubble.y + bubble.size > top &&
              bubble.y < bottom
            ) {
              const overlapX = Math.min(
                bubble.x + bubble.size - left,
                right - bubble.x,
              );
              const overlapY = Math.min(
                bubble.y + bubble.size - top,
                bottom - bubble.y,
              );

              if (overlapX < overlapY) {
                if (bubble.x + bubble.size / 2 < (left + right) / 2) {
                  bubble.x = left - bubble.size;
                } else {
                  bubble.x = right;
                }
                bubble.vx *= -1;
              } else {
                if (bubble.y + bubble.size / 2 < (top + bottom) / 2) {
                  bubble.y = top - bubble.size;
                } else {
                  bubble.y = bottom;
                }
                bubble.vy *= -1;
              }

              bubble.vx += (Math.random() - 0.5) * 0.2;
              bubble.vy += (Math.random() - 0.5) * 0.2;
            }
          }

          bubble.el.style.transform = `translate3d(${bubble.x}px, ${bubble.y}px, 0)`;
        });

        animationFrame = window.requestAnimationFrame(animateBubbles);
      };

      animationFrame = window.requestAnimationFrame(animateBubbles);
      cleanups.push(() => window.cancelAnimationFrame(animationFrame));
    }

    // ============================================
    // MODAL (COA)
    // ============================================
    const modal = document.getElementById('coa-modal');
    if (modal) {
      const openButtons = document.querySelectorAll('.modal-open');
      const closeButtons = modal.querySelectorAll('[data-modal-close], .modal-close');

      const openModal = () => {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      };

      const closeModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      };

      openButtons.forEach((btn) => on(btn, 'click', openModal));
      closeButtons.forEach((btn) => on(btn, 'click', closeModal));

      const escapeHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
          closeModal();
        }
      };
      on(document, 'keydown', escapeHandler);
    }

    // ============================================
    // SHOP NAVIGATION & BACK TO TOP
    // ============================================
    const shopNav = document.getElementById('shop-nav');
    const backToTop = document.getElementById('back-to-top');

    if (backToTop) {
      const toggleBackToTop = () => {
        if (window.scrollY > 400) {
          backToTop.classList.add('is-visible');
        } else {
          backToTop.classList.remove('is-visible');
        }
      };

      on(window, 'scroll', toggleBackToTop, { passive: true });
      toggleBackToTop();
    }

    if (shopNav) {
      const navLinks = shopNav.querySelectorAll('.shop-nav-link');
      const sections: Array<{ link: Element; section: Element; id: string }> = [];

      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const section = document.querySelector(href);
          if (section) {
            sections.push({ link, section, id: href.slice(1) });
          }
        }
      });

      const updateActiveNav = () => {
        const scrollY = window.scrollY;
        const offset = 150;
        let activeId: string | null = null;

        for (let i = sections.length - 1; i >= 0; i -= 1) {
          const { section, id } = sections[i];
          if ((section as HTMLElement).offsetTop - offset <= scrollY) {
            activeId = id;
            break;
          }
        }

        navLinks.forEach((link) => {
          const href = link.getAttribute('href');
          const isActive = href === `#${activeId}`;
          link.classList.toggle('is-active', isActive);
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
      };

      on(window, 'scroll', updateActiveNav, { passive: true });
      updateActiveNav();

      navLinks.forEach((link) => {
        const handler = (event: Event) => {
          const href = link.getAttribute('href');
          if (href && href.startsWith('#')) {
            event.preventDefault();
            const target = document.querySelector(href);
            if (target) {
              const navHeight = (shopNav as HTMLElement).offsetHeight;
              const targetPosition = (target as HTMLElement).offsetTop - navHeight - 20;
              window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
          }
        };
        on(link, 'click', handler);
      });
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
