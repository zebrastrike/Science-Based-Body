document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("is-ready");

  // ============================================
  // SHOPPING CART MODULE
  // ============================================
  const Cart = {
    storageKey: "sbb_cart",
    items: [],

    init() {
      try {
        this.items = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
      } catch {
        this.items = [];
      }
      this.updateBadge();
      this.renderDrawer();
      this.bindEvents();
    },

    save() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
      this.updateBadge();
      this.renderDrawer();
    },

    add(product) {
      // product: { id, name, variant, price, image }
      const existingIndex = this.items.findIndex(
        (item) => item.id === product.id && item.variant === product.variant
      );

      if (existingIndex > -1) {
        this.items[existingIndex].quantity += product.quantity || 1;
      } else {
        this.items.push({
          id: product.id,
          name: product.name,
          variant: product.variant || "",
          price: parseFloat(product.price) || 0,
          quantity: product.quantity || 1,
          image: product.image || "/images/products/vial.png"
        });
      }

      this.save();
      this.openDrawer();
      this.showNotification(`${product.name} added to cart`);
    },

    remove(index) {
      this.items.splice(index, 1);
      this.save();
    },

    updateQuantity(index, quantity) {
      if (quantity <= 0) {
        this.remove(index);
      } else {
        this.items[index].quantity = quantity;
        this.save();
      }
    },

    clear() {
      this.items = [];
      this.save();
    },

    getItemCount() {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },

    getSubtotal() {
      return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    updateBadge() {
      const badges = document.querySelectorAll(".cart-badge");
      const count = this.getItemCount();
      badges.forEach((badge) => {
        badge.textContent = count;
        badge.classList.toggle("is-hidden", count === 0);
      });
    },

    renderDrawer() {
      const itemsContainer = document.getElementById("cart-items");
      const subtotalEl = document.getElementById("cart-subtotal");
      const emptyMsg = document.getElementById("cart-empty");
      const checkoutBtn = document.getElementById("cart-checkout-btn");

      if (!itemsContainer) return;

      if (this.items.length === 0) {
        itemsContainer.innerHTML = "";
        if (emptyMsg) emptyMsg.classList.remove("is-hidden");
        if (checkoutBtn) checkoutBtn.classList.add("is-hidden");
      } else {
        if (emptyMsg) emptyMsg.classList.add("is-hidden");
        if (checkoutBtn) checkoutBtn.classList.remove("is-hidden");

        itemsContainer.innerHTML = this.items
          .map(
            (item, index) => `
          <div class="cart-item" data-index="${index}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image" />
            <div class="cart-item-details">
              <h4 class="cart-item-name">${item.name}</h4>
              ${item.variant ? `<span class="cart-item-variant">${item.variant}</span>` : ""}
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
        `
          )
          .join("");
      }

      if (subtotalEl) {
        subtotalEl.textContent = `$${this.getSubtotal().toFixed(2)}`;
      }
    },

    openDrawer() {
      const drawer = document.getElementById("cart-drawer");
      const overlay = document.getElementById("cart-overlay");
      if (drawer) {
        drawer.classList.add("is-open");
        drawer.setAttribute("aria-hidden", "false");
      }
      if (overlay) overlay.classList.add("is-visible");
      document.body.classList.add("cart-open");
    },

    closeDrawer() {
      const drawer = document.getElementById("cart-drawer");
      const overlay = document.getElementById("cart-overlay");
      if (drawer) {
        drawer.classList.remove("is-open");
        drawer.setAttribute("aria-hidden", "true");
      }
      if (overlay) overlay.classList.remove("is-visible");
      document.body.classList.remove("cart-open");
    },

    bindEvents() {
      // Cart toggle buttons
      document.querySelectorAll("[data-cart-toggle]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const drawer = document.getElementById("cart-drawer");
          if (drawer && drawer.classList.contains("is-open")) {
            this.closeDrawer();
          } else {
            this.openDrawer();
          }
        });
      });

      // Close button
      document.querySelectorAll("[data-cart-close]").forEach((btn) => {
        btn.addEventListener("click", () => this.closeDrawer());
      });

      // Overlay click to close
      const overlay = document.getElementById("cart-overlay");
      if (overlay) {
        overlay.addEventListener("click", () => this.closeDrawer());
      }

      // Escape key to close
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const drawer = document.getElementById("cart-drawer");
          if (drawer && drawer.classList.contains("is-open")) {
            this.closeDrawer();
          }
        }
      });

      // Quantity and remove buttons (delegated)
      const itemsContainer = document.getElementById("cart-items");
      if (itemsContainer) {
        itemsContainer.addEventListener("click", (e) => {
          const target = e.target.closest("button");
          if (!target) return;

          const index = parseInt(target.dataset.index, 10);
          if (isNaN(index)) return;

          if (target.classList.contains("qty-minus")) {
            this.updateQuantity(index, this.items[index].quantity - 1);
          } else if (target.classList.contains("qty-plus")) {
            this.updateQuantity(index, this.items[index].quantity + 1);
          } else if (target.classList.contains("cart-item-remove")) {
            this.remove(index);
          }
        });
      }

      // Add to cart buttons
      document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const product = {
            id: btn.dataset.productId || btn.dataset.addToCart,
            name: btn.dataset.productName || "Product",
            variant: btn.dataset.productVariant || "",
            price: btn.dataset.productPrice || 0,
            quantity: parseInt(btn.dataset.productQty, 10) || 1,
            image: btn.dataset.productImage || "/images/products/vial.png"
          };
          this.add(product);
        });
      });
    },

    showNotification(message) {
      // Create toast notification
      let toast = document.getElementById("cart-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "cart-toast";
        toast.className = "cart-toast";
        document.body.appendChild(toast);
      }

      toast.textContent = message;
      toast.classList.add("is-visible");

      setTimeout(() => {
        toast.classList.remove("is-visible");
      }, 2500);
    }
  };

  // Initialize cart
  Cart.init();

  // Expose cart globally for debugging/external use
  window.SBBCart = Cart;

  // ============================================
  // STICKY HEADER
  // ============================================
  const header = document.querySelector(".site-header");
  if (header) {
    let lastScroll = 0;
    const handleHeaderScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 50) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
      lastScroll = currentScroll;
    };
    window.addEventListener("scroll", handleHeaderScroll, { passive: true });
    handleHeaderScroll();
  }

  const reveals = document.querySelectorAll(".reveal");
  reveals.forEach((el, index) => {
    el.style.setProperty("--delay", `${index * 80}ms`);
  });

  const accordionItems = document.querySelectorAll(".accordion-item");
  accordionItems.forEach((item) => {
    const trigger = item.querySelector(".accordion-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      accordionItems.forEach((panel) => panel.classList.remove("is-open"));
      if (!isOpen) {
        item.classList.add("is-open");
      }
    });
  });

  const library = document.querySelector(".peptide-library");
  if (library) {
    const categoryView = library.querySelector("[data-library-category-view]");
    const peptideView = library.querySelector("[data-library-peptide-view]");
    const categoryCards = Array.from(library.querySelectorAll("[data-category-id]"));
    const peptideCards = Array.from(library.querySelectorAll("[data-peptide-card]"));
    const backButton = library.querySelector("[data-library-back]");
    const activeName = library.querySelector("[data-active-category-name]");
    const activeDescription = library.querySelector("[data-active-category-description]");
    const activeIcon = library.querySelector("[data-active-category-icon]");
    const activeCount = library.querySelector("[data-active-category-count]");
    const activeHeader = library.querySelector("[data-active-category]");

    const parseCategories = (value) =>
      value ? value.split(",").map((entry) => entry.trim()).filter(Boolean) : [];

    const categoryMap = new Map();
    categoryCards.forEach((card) => {
      const id = card.dataset.categoryId;
      if (!id) return;
      categoryMap.set(id, {
        id,
        name: card.dataset.categoryName || "",
        description: card.dataset.categoryDescription || "",
        icon: card.dataset.categoryIcon || "",
        accent: card.dataset.categoryAccent || "",
        card,
        countEl: card.querySelector("[data-category-count]")
      });
    });

    const counts = {};
    peptideCards.forEach((card) => {
      const ids = parseCategories(card.dataset.categories);
      ids.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });

      const subtitle = card.dataset.peptideSubtitle || "";
      const mechanism = card.dataset.peptideMechanism || "";
      const summaryEl = card.querySelector("[data-peptide-summary]");
      if (summaryEl) {
        const suffix = "Supplied for laboratory research and educational reference only.";
        summaryEl.textContent = subtitle ? `${subtitle} ${suffix}` : suffix;
      }

      const bulletsEl = card.querySelector("[data-peptide-bullets]");
      if (bulletsEl) {
        bulletsEl.innerHTML = "";
        const categoryNames = ids
          .map((id) => (categoryMap.get(id) ? categoryMap.get(id).name : ""))
          .filter(Boolean);
        const bullets = [];
        if (mechanism) bullets.push(`Mechanism: ${mechanism}`);
        if (categoryNames.length) bullets.push(`Research focus: ${categoryNames.join(", ")}`);
        bullets.push("Research context: preclinical and analytical studies");
        bullets.forEach((text) => {
          const li = document.createElement("li");
          li.textContent = text;
          bulletsEl.appendChild(li);
        });
      }

      const tagsEl = card.querySelector("[data-peptide-tags]");
      if (tagsEl) {
        tagsEl.innerHTML = "";
        const categoryNames = ids
          .map((id) => (categoryMap.get(id) ? categoryMap.get(id).name : ""))
          .filter(Boolean);
        categoryNames.forEach((name) => {
          const span = document.createElement("span");
          span.className = "peptide-tag";
          span.textContent = name;
          tagsEl.appendChild(span);
        });
      }
    });

    categoryMap.forEach((category, id) => {
      const count = counts[id] || 0;
      if (category.countEl) {
        category.countEl.textContent = `${count} peptides`;
      }
    });

    const collapseAll = () => {
      peptideCards.forEach((card) => {
        card.classList.remove("is-expanded");
        const toggle = card.querySelector("[data-peptide-toggle]");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
        const details = card.querySelector(".peptide-details");
        if (details) details.hidden = true;
      });
    };

      const showCategory = (id) => {
        const category = categoryMap.get(id);
        if (!category) return;
        categoryCards.forEach((card) => {
          card.classList.toggle("is-selected", card.dataset.categoryId === id);
        });
        if (categoryView) categoryView.classList.add("is-hidden");
        if (peptideView) peptideView.classList.remove("is-hidden");
      if (activeName) activeName.textContent = category.name;
      if (activeDescription) activeDescription.textContent = category.description;
      if (activeIcon) activeIcon.textContent = category.icon;
      if (activeCount) activeCount.textContent = `${counts[id] || 0} peptides`;
      if (activeHeader && category.accent) {
        activeHeader.style.setProperty("--category-accent", category.accent);
      }

      peptideCards.forEach((card) => {
        const ids = parseCategories(card.dataset.categories);
        const matches = ids.includes(id);
        card.classList.toggle("is-hidden", !matches);
        if (matches && category.accent) {
          card.style.setProperty("--peptide-accent", category.accent);
        }
        const categoryLabel = card.querySelector("[data-peptide-category]");
        if (categoryLabel) {
          categoryLabel.textContent = category.name;
        }
      });

      collapseAll();
      library.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    categoryCards.forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.categoryId;
        if (id) showCategory(id);
      });
    });

    if (backButton) {
      backButton.addEventListener("click", () => {
        if (peptideView) peptideView.classList.add("is-hidden");
        if (categoryView) categoryView.classList.remove("is-hidden");
        collapseAll();
        library.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    peptideCards.forEach((card) => {
      const toggle = card.querySelector("[data-peptide-toggle]");
      const details = card.querySelector(".peptide-details");
      if (!toggle || !details) return;
      toggle.addEventListener("click", () => {
        const isExpanded = card.classList.contains("is-expanded");
        collapseAll();
        if (!isExpanded) {
          card.classList.add("is-expanded");
          toggle.setAttribute("aria-expanded", "true");
          details.hidden = false;
        }
      });
    });
  }


  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const bubbleField = document.querySelector(".bubble-field");
  const bubbleEls = bubbleField
    ? Array.from(bubbleField.querySelectorAll(".bubble"))
    : [];

  if (!prefersReducedMotion && bubbleField && bubbleEls.length) {
    const obstacleSelectors = [
      ".hero-copy",
      ".section-heading",
      ".card",
      ".product-hero-copy",
      ".subscription-block",
      ".accordion-panel",
      ".modal-card"
    ];
    let obstacles = [];
    let needsRefresh = true;
    let lastRefresh = 0;

    const refreshObstacles = () => {
      const nodes = document.querySelectorAll(obstacleSelectors.join(","));
      obstacles = Array.from(nodes)
        .map((node) => node.getBoundingClientRect())
        .filter(
          (rect) =>
            rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.top < window.innerHeight
        );
    };

    const scheduleRefresh = () => {
      needsRefresh = true;
    };

    window.addEventListener("resize", scheduleRefresh, { passive: true });
    window.addEventListener("scroll", scheduleRefresh, { passive: true });

    const bubbleState = bubbleEls.map((bubble) => {
      const size = bubble.offsetWidth;
      const startX = bubble.offsetLeft;
      const startY = bubble.offsetTop;
      bubble.style.left = "0px";
      bubble.style.top = "0px";
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 0.8;
      bubble.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;
      return {
        el: bubble,
        size,
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        seed: Math.random() * Math.PI * 2,
        isPopping: false
      };
    });

    const popDuration = 420;
    const respawnBubble = (bubble) => {
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

    const popBubble = (bubble) => {
      if (bubble.isPopping) return;
      bubble.isPopping = true;
      bubble.el.classList.add("is-popping");
      window.setTimeout(() => {
        respawnBubble(bubble);
        bubble.el.classList.remove("is-popping");
        bubble.isPopping = false;
      }, popDuration);
    };

    const handleBubblePop = (event) => {
      const target = event.target;
      if (
        target &&
        target.closest(
          "button, a, input, textarea, select, label, [role='button'], .modal, .site-nav"
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

    window.addEventListener("pointerdown", handleBubblePop, { passive: true });

    let lastTime = performance.now();
    const animateBubbles = (time) => {
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
              right - bubble.x
            );
            const overlapY = Math.min(
              bubble.y + bubble.size - top,
              bottom - bubble.y
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

      window.requestAnimationFrame(animateBubbles);
    };

    window.requestAnimationFrame(animateBubbles);
  }

  const modal = document.getElementById("coa-modal");
  if (modal) {
    const openButtons = document.querySelectorAll(".modal-open");
    const closeButtons = modal.querySelectorAll("[data-modal-close], .modal-close");

    const openModal = () => {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
    };

    const closeModal = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    };

    openButtons.forEach((btn) => btn.addEventListener("click", openModal));
    closeButtons.forEach((btn) => btn.addEventListener("click", closeModal));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  // Shop Navigation & Back to Top
  const shopNav = document.getElementById("shop-nav");
  const backToTop = document.getElementById("back-to-top");

  if (backToTop) {
    const toggleBackToTop = () => {
      if (window.scrollY > 400) {
        backToTop.classList.add("is-visible");
      } else {
        backToTop.classList.remove("is-visible");
      }
    };

    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    toggleBackToTop();
  }

  if (shopNav) {
    const navLinks = shopNav.querySelectorAll(".shop-nav-link");
    const sections = [];

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        const section = document.querySelector(href);
        if (section) {
          sections.push({ link, section, id: href.slice(1) });
        }
      }
    });

    const updateActiveNav = () => {
      const scrollY = window.scrollY;
      const offset = 150;
      let activeId = null;

      for (let i = sections.length - 1; i >= 0; i--) {
        const { section, id } = sections[i];
        if (section.offsetTop - offset <= scrollY) {
          activeId = id;
          break;
        }
      }

      navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        const isActive = href === `#${activeId}`;
        link.classList.toggle("is-active", isActive);
      });

      // Auto-scroll nav to keep active link visible
      const activeLink = shopNav.querySelector(".shop-nav-link.is-active");
      if (activeLink) {
        const scrollContainer = shopNav.querySelector(".shop-nav-scroll");
        if (scrollContainer) {
          const linkRect = activeLink.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();

          if (linkRect.left < containerRect.left || linkRect.right > containerRect.right) {
            activeLink.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
          }
        }
      }
    };

    window.addEventListener("scroll", updateActiveNav, { passive: true });
    updateActiveNav();

    // Smooth scroll for nav links
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            const navHeight = shopNav.offsetHeight;
            const targetPosition = target.offsetTop - navHeight - 20;
            window.scrollTo({ top: targetPosition, behavior: "smooth" });
          }
        }
      });
    });
  }
});
