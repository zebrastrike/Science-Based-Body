document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("is-ready");

  // ============================================
  // ACCOUNT / LOGIN NAV LINK (injected on all pages)
  // ============================================
  (function () {
    var cartBtn = document.querySelector("[data-cart-toggle]");
    if (!cartBtn) return;

    var link = document.createElement("a");
    link.href = "login.html";
    link.className = "nav-account";
    link.id = "nav-account";
    link.setAttribute("aria-label", "Account");
    link.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>' +
        '<circle cx="12" cy="7" r="4"/>' +
      '</svg>';

    cartBtn.parentNode.insertBefore(link, cartBtn);

    // If logged in, show user initial instead of generic icon
    try {
      var user = JSON.parse(localStorage.getItem("sbb_user"));
      if (user && localStorage.getItem("accessToken")) {
        var initial = (user.firstName || "?")[0].toUpperCase();
        link.innerHTML =
          '<span style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#e3a7a1,#c7d7e6);' +
          'color:#fff;font-size:0.7rem;font-weight:600;display:inline-flex;align-items:center;justify-content:center;">' +
          initial + '</span>';
      }
    } catch (e) {}
  })();

  // ============================================
  // AFFILIATE TRACKING (capture ?ref= param)
  // ============================================
  (function() {
    var params = new URLSearchParams(window.location.search);
    var ref = params.get("ref");
    if (ref) {
      // Set sbb_ref cookie for 30 days
      var expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = "sbb_ref=" + encodeURIComponent(ref) + ";expires=" + expires + ";path=/;SameSite=Lax";
      // Track click via API (non-blocking)
      var apiBase = window.SBB_API_BASE || "https://api.sbbpeptides.com/api/v1";
      fetch(apiBase + "/affiliates/track/" + encodeURIComponent(ref)).catch(function() {});
    }
  })();

  // ============================================
  // MOBILE NAVIGATION (HAMBURGER MENU)
  // ============================================
  const menuToggle = document.querySelector(".menu-toggle");
  const siteNav = document.querySelector(".site-nav");

  if (menuToggle && siteNav) {
    // Create overlay element
    let navOverlay = document.querySelector(".nav-overlay");
    if (!navOverlay) {
      navOverlay = document.createElement("div");
      navOverlay.className = "nav-overlay";
      document.body.appendChild(navOverlay);
    }

    const openMenu = () => {
      menuToggle.setAttribute("aria-expanded", "true");
      siteNav.classList.add("is-open");
      navOverlay.classList.add("is-visible");
      document.body.classList.add("menu-open");
    };

    const closeMenu = () => {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
      navOverlay.classList.remove("is-visible");
      document.body.classList.remove("menu-open");
    };

    const toggleMenu = () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    };

    // Toggle menu on button click
    menuToggle.addEventListener("click", toggleMenu);

    // Close menu when clicking overlay
    navOverlay.addEventListener("click", closeMenu);

    // Close menu when clicking a nav link
    siteNav.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        // Small delay to allow navigation
        setTimeout(closeMenu, 100);
      });
    });

    // Close menu on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && siteNav.classList.contains("is-open")) {
        closeMenu();
      }
    });

    // Close menu on window resize (if larger than mobile breakpoint)
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 768 && siteNav.classList.contains("is-open")) {
          closeMenu();
        }
      }, 100);
    });
  }

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

      // Free shipping progress banner
      const FREE_SHIP = 500;
      const sub = this.getSubtotal();
      let shipBanner = document.getElementById("cart-free-ship-banner");
      if (!shipBanner) {
        shipBanner = document.createElement("div");
        shipBanner.id = "cart-free-ship-banner";
        shipBanner.style.cssText = "padding:8px 16px;border-radius:6px;font-size:0.82rem;text-align:center;font-weight:500;margin-bottom:10px;";
        const footer = document.querySelector(".cart-drawer-footer");
        if (footer) footer.insertBefore(shipBanner, footer.firstChild);
      }
      if (sub > 0 && sub < FREE_SHIP) {
        const rem = (FREE_SHIP - sub).toFixed(2);
        shipBanner.style.display = "block";
        shipBanner.style.background = "linear-gradient(135deg, #f7f2ec 0%, rgba(227,167,161,0.25) 100%)";
        shipBanner.style.color = "#1f2a36";
        shipBanner.innerHTML = `Add <strong>$${rem}</strong> more for <strong>FREE shipping!</strong>`;
      } else if (sub >= FREE_SHIP) {
        shipBanner.style.display = "block";
        shipBanner.style.background = "linear-gradient(135deg, #b9cbb6 0%, #c7d7e6 100%)";
        shipBanner.style.color = "#1f2a36";
        shipBanner.innerHTML = "&#10003; You qualify for <strong>FREE shipping!</strong>";
      } else {
        shipBanner.style.display = "none";
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

      const ensureAddToCartButtons = () => {
        document.querySelectorAll(".product-card").forEach((card) => {
          if (card.querySelector(".btn-add-cart")) return;
          const body = card.querySelector(".product-body") || card;
          const name =
            card.querySelector("h3")?.textContent?.trim() || "Product";
          const priceText =
            card.querySelector(".price")?.textContent || "";
          const priceMatch = priceText.match(/[\d,.]+/);
          const price = priceMatch
            ? priceMatch[0].replace(/,/g, "")
            : "0";
          const img =
            card.querySelector("img")?.getAttribute("src") ||
            "/images/products/vial.png";
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          const button = document.createElement("button");
          button.type = "button";
          button.className = "btn-add-cart";
          button.dataset.addToCart = slug || "product";
          button.dataset.productName = name;
          button.dataset.productPrice = price;
          button.dataset.productImage = img;
          button.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg> Add to Cart';
          body.appendChild(button);
        });
      };

      // Add to cart buttons (event delegation so dynamic carousel buttons work too)
      ensureAddToCartButtons();
      document.body.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-add-to-cart]");
        if (!btn) return;
        e.preventDefault();
        const product = {
          id: btn.dataset.productId || btn.dataset.addToCart,
          name: btn.dataset.productName || "Product",
          variant: btn.dataset.productVariant || "",
          price: btn.dataset.productPrice || 0,
          quantity: parseInt(btn.dataset.productQty, 10) || 1,
          image: btn.dataset.productImage || "/images/products/vial.png"
        };
        SBBCart.add(product);
      });
    },

    /* ------ Variant selector handler ------ */
    initVariantSelectors() {
      document.querySelectorAll(".variant-select").forEach((select) => {
        select.addEventListener("change", function () {
          const card = this.closest(".product-card");
          if (!card) return;

          const opt = this.options[this.selectedIndex];
          const price = opt.dataset.price;
          const variantId = opt.value;
          const variantName = opt.dataset.variant || opt.textContent.split(" - ")[0];

          // Update displayed price
          const priceEl = card.querySelector(".price");
          if (priceEl && price) {
            priceEl.textContent = "$" + parseFloat(price).toFixed(2);
          }

          // Update add-to-cart button data attributes
          const btn = card.querySelector("[data-add-to-cart]");
          if (btn && price) {
            btn.dataset.addToCart = variantId;
            btn.dataset.productId = variantId;
            btn.dataset.productPrice = price;
            btn.dataset.productVariant = variantName;
          }
        });

        // Trigger initial selection to sync price with first variant
        select.dispatchEvent(new Event("change"));
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
  Cart.initVariantSelectors();

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
        // Also deselect A-Z card and hide A-Z view
        const azCardEl = library.querySelector("[data-az-view]");
        if (azCardEl) azCardEl.classList.remove("is-selected");
        const azViewEl = library.querySelector("[data-library-az-view]");
        if (azViewEl) azViewEl.classList.add("is-hidden");
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

    /* ── A-Z View ──────────────────────────────────────────── */
    const azCard = library.querySelector("[data-az-view]");
    const azView = library.querySelector("[data-library-az-view]");
    const azBack = library.querySelector("[data-az-back]");
    const azLetterNav = library.querySelector("[data-az-letter-nav]");
    const azPeptideList = library.querySelector("[data-az-peptide-list]");
    const azCountEl = library.querySelector("[data-az-count]");
    const azHeaderCount = library.querySelector("[data-az-header-count]");

    if (azCard && azView) {
      // Set total count on the A-Z card
      const totalPeptides = peptideCards.length;
      if (azCountEl) azCountEl.textContent = totalPeptides + " peptides";
      if (azHeaderCount) azHeaderCount.textContent = totalPeptides + " peptides";

      // Build alphabetical index
      const buildAzView = () => {
        if (!azPeptideList) return;
        // Collect peptide data from all cards
        const peptides = peptideCards.map((card) => {
          const name = card.querySelector("h3") ? card.querySelector("h3").textContent.trim() : "";
          return { name, card };
        }).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

        // Group by first letter
        const groups = {};
        peptides.forEach((p) => {
          const letter = /^[A-Za-z]/.test(p.name) ? p.name[0].toUpperCase() : "#";
          if (!groups[letter]) groups[letter] = [];
          groups[letter].push(p);
        });

        // Build letter nav
        if (azLetterNav) {
          azLetterNav.innerHTML = "";
          const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");
          allLetters.forEach((letter) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = letter;
            if (!groups[letter]) {
              btn.disabled = true;
            } else {
              btn.addEventListener("click", () => {
                const target = azPeptideList.querySelector('[data-az-letter="' + letter + '"]');
                if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
                azLetterNav.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
                btn.classList.add("is-active");
              });
            }
            azLetterNav.appendChild(btn);
          });
        }

        // Build peptide list grouped by letter
        azPeptideList.innerHTML = "";
        const sortedLetters = Object.keys(groups).sort((a, b) => {
          if (a === "#") return 1;
          if (b === "#") return -1;
          return a.localeCompare(b);
        });

        sortedLetters.forEach((letter) => {
          const group = document.createElement("div");
          group.className = "az-letter-group";
          group.setAttribute("data-az-letter", letter);
          const heading = document.createElement("h3");
          heading.textContent = letter;
          group.appendChild(heading);

          groups[letter].forEach((p) => {
            // Clone the peptide card for the A-Z view
            const clone = p.card.cloneNode(true);
            clone.classList.remove("is-hidden", "is-expanded");
            const details = clone.querySelector(".peptide-details");
            if (details) details.hidden = true;
            const toggle = clone.querySelector("[data-peptide-toggle]");
            if (toggle) {
              toggle.setAttribute("aria-expanded", "false");
              toggle.addEventListener("click", () => {
                const isExp = clone.classList.contains("is-expanded");
                // Collapse all in A-Z view
                azPeptideList.querySelectorAll(".peptide-card.is-expanded").forEach((c) => {
                  c.classList.remove("is-expanded");
                  const t = c.querySelector("[data-peptide-toggle]");
                  if (t) t.setAttribute("aria-expanded", "false");
                  const d = c.querySelector(".peptide-details");
                  if (d) d.hidden = true;
                });
                if (!isExp) {
                  clone.classList.add("is-expanded");
                  toggle.setAttribute("aria-expanded", "true");
                  if (details) details.hidden = false;
                }
              });
            }
            // Set category label to all categories
            const catLabel = clone.querySelector("[data-peptide-category]");
            if (catLabel) {
              const ids = (p.card.dataset.categories || "").split(",").map((s) => s.trim()).filter(Boolean);
              const names = ids.map((id) => categoryMap.get(id) ? categoryMap.get(id).name : "").filter(Boolean);
              catLabel.textContent = names.join(", ");
            }
            group.appendChild(clone);
          });

          azPeptideList.appendChild(group);
        });
      };

      buildAzView();

      // Show A-Z view on card click
      azCard.addEventListener("click", () => {
        categoryCards.forEach((c) => c.classList.remove("is-selected"));
        azCard.classList.add("is-selected");
        if (categoryView) categoryView.classList.add("is-hidden");
        if (peptideView) peptideView.classList.add("is-hidden");
        azView.classList.remove("is-hidden");
        collapseAll();
        library.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      // Back from A-Z view
      if (azBack) {
        azBack.addEventListener("click", () => {
          azView.classList.add("is-hidden");
          if (categoryView) categoryView.classList.remove("is-hidden");
          categoryCards.forEach((c) => c.classList.remove("is-selected"));
          azCard.classList.remove("is-selected");
          library.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    }
  }


  // ============================================
  // BUBBLE PHYSICS — gentle scientific float
  // ============================================
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const bubbleField = document.querySelector(".bubble-field");
  const bubbleEls = bubbleField
    ? Array.from(bubbleField.querySelectorAll(".bubble"))
    : [];

  if (!prefersReducedMotion && bubbleField && bubbleEls.length) {
    // Elements bubbles bounce off — product cards, section headers, title cards
    // Bubbles float freely over text (magnify lens effect)
    const obstacleSelectors = [
      ".product-card",
      ".card",
      ".section-heading",
      ".subscription-block",
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

    const scheduleRefresh = () => { needsRefresh = true; };
    window.addEventListener("resize", scheduleRefresh, { passive: true });
    window.addEventListener("scroll", scheduleRefresh, { passive: true });

    const isMobile = () => window.innerWidth <= 768;

    // Initialize each bubble at its CSS position (no off-screen entry)
    const bubbleState = bubbleEls.map((bubble, index) => {
      const size = bubble.offsetWidth;
      const rect = bubble.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const x = rect.left;
      const y = rect.top + scrollY;
      bubble.style.left = "0px";
      bubble.style.top = "0px";
      bubble.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      // Unique seed per bubble for organic phase offsets
      const seed = (index * 1.618 + 0.5) * Math.PI;
      // Gentle random initial direction
      const angle = Math.random() * Math.PI * 2;
      const mobile = isMobile();
      const baseSpeed = mobile ? 0.25 + Math.random() * 0.15 : 0.42 + Math.random() * 0.3;
      return {
        el: bubble,
        size,
        x: x,
        y: y,
        vx: Math.cos(angle) * baseSpeed,
        vy: Math.sin(angle) * baseSpeed,
        seed: seed,
        isPopping: false
      };
    });

    const popDuration = 420;
    const respawnBubble = (bubble) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Respawn at a random position within the viewport (no off-screen)
      bubble.x = Math.random() * (width - bubble.size);
      bubble.y = Math.random() * (height - bubble.size);
      const mobile = isMobile();
      const angle = Math.random() * Math.PI * 2;
      const speed = mobile ? 0.15 + Math.random() * 0.15 : 0.25 + Math.random() * 0.25;
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
      const pad = 12;
      const mobile = isMobile();
      // Speed limit: prevent bubbles from ever going too fast
      const maxSpeed = mobile ? 0.55 : 0.9;

      bubbleState.forEach((bubble) => {
        if (bubble.isPopping) return;

        // Organic drift: layered sine waves at different frequencies
        // Creates bouncy figure-8 / orbital feel
        const t = time * 0.001; // seconds
        const s = bubble.seed;
        const driftScale = mobile ? 0.03 : 0.05;
        const driftX = (Math.sin(t * 0.15 + s) * 0.55 + Math.sin(t * 0.28 + s * 1.3) * 0.3 + Math.sin(t * 0.45 + s * 2.1) * 0.15) * driftScale;
        const driftY = (Math.cos(t * 0.13 + s * 0.8) * 0.5 + Math.cos(t * 0.24 + s * 1.5) * 0.3 + Math.cos(t * 0.4 + s * 1.9) * 0.2) * driftScale;

        // Apply drift + velocity
        bubble.x += (bubble.vx + driftX) * dt;
        bubble.y += (bubble.vy + driftY) * dt;

        // Bouncy edge bouncing — all 4 walls, retain energy
        if (bubble.x <= 0) {
          bubble.x = 0;
          bubble.vx = Math.abs(bubble.vx) * 0.92;
        }
        if (bubble.x + bubble.size >= width) {
          bubble.x = width - bubble.size;
          bubble.vx = -Math.abs(bubble.vx) * 0.92;
        }
        if (bubble.y <= 0) {
          bubble.y = 0;
          bubble.vy = Math.abs(bubble.vy) * 0.92;
        }
        if (bubble.y + bubble.size >= height) {
          bubble.y = height - bubble.size;
          bubble.vy = -Math.abs(bubble.vy) * 0.92;
        }

        // Obstacle bounce — deflect off product cards, section headers, title cards
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
            const overlapL = bubble.x + bubble.size - left;
            const overlapR = right - bubble.x;
            const overlapT = bubble.y + bubble.size - top;
            const overlapB = bottom - bubble.y;
            const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);

            // Playful bounce — deflect with a random kick
            const bounceFactor = 0.85;
            if (minOverlap === overlapL) {
              bubble.x = left - bubble.size;
              bubble.vx = -Math.abs(bubble.vx) * bounceFactor;
            } else if (minOverlap === overlapR) {
              bubble.x = right;
              bubble.vx = Math.abs(bubble.vx) * bounceFactor;
            } else if (minOverlap === overlapT) {
              bubble.y = top - bubble.size;
              bubble.vy = -Math.abs(bubble.vy) * bounceFactor;
            } else {
              bubble.y = bottom;
              bubble.vy = Math.abs(bubble.vy) * bounceFactor;
            }

            // Double-bounce jitter — random perpendicular kick for playful deflection
            bubble.vx += (Math.random() - 0.5) * 0.2;
            bubble.vy += (Math.random() - 0.5) * 0.2;
          }
        }

        // Clamp speed — no lightning-fast bubbles
        const speed = Math.sqrt(bubble.vx * bubble.vx + bubble.vy * bubble.vy);
        if (speed > maxSpeed) {
          const scale = maxSpeed / speed;
          bubble.vx *= scale;
          bubble.vy *= scale;
        }
        // If bubble almost stops, give it a gentle nudge
        if (speed < 0.03) {
          const nudgeAngle = Math.random() * Math.PI * 2;
          bubble.vx += Math.cos(nudgeAngle) * 0.05;
          bubble.vy += Math.sin(nudgeAngle) * 0.05;
        }

        // Gentle scale pulse — breathing / bouncing feel
        const pulse = 1 + Math.sin(t * 0.35 + s * 2) * 0.035;
        bubble.el.style.transform = `translate3d(${bubble.x}px, ${bubble.y}px, 0) scale(${pulse})`;
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

      // Sync sidebar active state
      const sidebarLinks = document.querySelectorAll(".shop-sidebar-link");
      sidebarLinks.forEach((link) => {
        const section = link.getAttribute("data-section");
        link.classList.toggle("is-active", section === activeId);
      });
    };

    window.addEventListener("scroll", updateActiveNav, { passive: true });
    updateActiveNav();

    // Smooth scroll for nav links (top bar + sidebar)
    var allNavLinks = Array.from(navLinks);
    document.querySelectorAll(".shop-sidebar-link").forEach(function(l) { allNavLinks.push(l); });
    allNavLinks.forEach((link) => {
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

  // ============================================
  // SITE SEARCH
  // ============================================
  const SiteSearch = {
    products: [],
    searchInput: document.getElementById("search-input"),
    searchResults: document.getElementById("search-results"),
    searchContainer: document.getElementById("site-search"),
    mobileToggle: document.getElementById("mobile-search-toggle"),

    init() {
      if (!this.searchInput) return;
      this.buildProductIndex();
      this.bindEvents();
    },

    buildProductIndex() {
      // Scrape product cards from the current page (works on shop.html)
      const cards = document.querySelectorAll(".product-card");
      cards.forEach((card) => {
        const name = (card.querySelector("h3") || {}).textContent || "";
        const desc = (card.querySelector(".product-body p") || {}).textContent || "";
        const label = (card.querySelector(".label") || {}).textContent || "";
        const priceEl = card.querySelector(".price");
        const price = priceEl ? priceEl.textContent.trim() : "";
        const img = (card.querySelector("img") || {}).getAttribute("src") || "/images/products/vial.png";
        const section = card.closest("section");
        const sectionId = section ? section.id : "";

        if (name) {
          this.products.push({ name, desc, label, price, img, sectionId });
        }
      });

      // If we're not on shop page, load a static product catalog for search
      if (this.products.length === 0) {
        this.products = this.getStaticCatalog();
      }
    },

    getStaticCatalog() {
      // Minimal catalog for non-shop pages — redirects to shop.html#section
      // Prices from CSV B2C column. Wholesale-only products excluded.
      return [
        // METABOLIC
        { name: "Semaglutide", desc: "GLP-1 receptor agonist", label: "METABOLIC", price: "From $40.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        { name: "Tirzepatide", desc: "Dual GIP/GLP-1 receptor agonist", label: "METABOLIC", price: "From $50.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        { name: "Retatrutide", desc: "Triple GIP/GLP-1/glucagon agonist", label: "METABOLIC", price: "From $250.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        { name: "Cagrilintide", desc: "Amylin analog", label: "METABOLIC", price: "From $145.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        { name: "Cagrilintide + Semaglutide", desc: "Dual amylin/GLP-1 combination", label: "METABOLIC", price: "From $150.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        { name: "Survodutide", desc: "Dual GLP-1/glucagon agonist", label: "METABOLIC", price: "$330.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        { name: "Mazdutide", desc: "GLP-1/glucagon dual agonist", label: "METABOLIC", price: "$250.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        { name: "5-Amino-1MQ", desc: "NNMT inhibitor", label: "METABOLIC", price: "$110.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        { name: "AOD-9604", desc: "Modified HGH fragment", label: "METABOLIC", price: "$145.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        { name: "Adipotide", desc: "Peptidomimetic compound", label: "METABOLIC", price: "$225.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        { name: "L-Carnitine", desc: "Amino acid derivative", label: "METABOLIC", price: "$95.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        { name: "LC120", desc: "Metabolic research blend", label: "METABOLIC", price: "$80.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        { name: "LC216", desc: "Metabolic research blend", label: "METABOLIC", price: "$80.00", img: "/images/products/vial.png", sectionId: "metabolic" },
        // GROWTH HORMONE
        { name: "CJC-1295 (no DAC)", desc: "GHRH analog", label: "GROWTH HORMONE", price: "From $110.00", img: "/images/products/vial.png", sectionId: "growth-hormone" },
        { name: "CJC-1295 (with DAC)", desc: "Extended half-life GHRH", label: "GROWTH HORMONE", price: "$210.00", img: "/images/products/vial.png", sectionId: "growth-hormone" },
        { name: "CJC-1295 + Ipamorelin", desc: "GHRH/GHRP combination", label: "GROWTH HORMONE", price: "$180.00", img: "/images/products/vial.png", sectionId: "growth-hormone" },
        { name: "Ipamorelin", desc: "Growth hormone secretagogue", label: "GROWTH HORMONE", price: "From $65.00", img: "/images/products/vial.png", sectionId: "growth-hormone" },
        { name: "Sermorelin", desc: "GHRH analog", label: "GROWTH HORMONE", price: "From $100.00", img: "/images/products/vial.png", sectionId: "growth-hormone" },
        { name: "Tesamorelin", desc: "GHRH analog", label: "GROWTH HORMONE", price: "From $130.00", img: "/images/products/vial.png", sectionId: "growth-hormone" },
        { name: "Hexarelin", desc: "GHRP secretagogue", label: "GROWTH HORMONE", price: "$140.00", img: "/images/products/vial.png", sectionId: "growth-hormone" },
        { name: "IGF-1 LR3", desc: "Long-acting IGF-1 analog", label: "GROWTH HORMONE", price: "From $65.00", img: "/images/products/vial.png", sectionId: "growth-hormone" },
        // RECOVERY
        { name: "BPC-157", desc: "Body Protection Compound", label: "RECOVERY", price: "From $55.00", img: "/images/products/vial.png", sectionId: "recovery" },
        { name: "TB-500", desc: "Thymosin Beta-4 fragment", label: "RECOVERY", price: "From $60.00", img: "/images/products/vial.png", sectionId: "recovery" },
        { name: "BPC-157 + TB-500", desc: "Recovery combination", label: "RECOVERY", price: "From $125.00", img: "/images/products/vial.png", sectionId: "recovery" },
        // COSMETIC
        { name: "GHK-Cu", desc: "Copper tripeptide", label: "COSMETIC", price: "$100.00", img: "/images/products/vial.png", sectionId: "cosmetic" },
        { name: "SNAP-8", desc: "Acetyl octapeptide-3", label: "COSMETIC", price: "$55.00", img: "/images/products/vial.png", sectionId: "cosmetic" },
        { name: "SNAP-8 + GHK-Cu Serum", desc: "Cosmetic peptide serum", label: "COSMETIC", price: "$65.00", img: "/images/products/vial.png", sectionId: "cosmetic" },
        // ANTI-INFLAMMATORY
        { name: "KPV", desc: "Alpha-MSH-derived tripeptide", label: "ANTI-INFLAMMATORY", price: "$65.00", img: "/images/products/vial.png", sectionId: "anti-inflammatory" },
        // ANTIMICROBIAL
        { name: "LL-37", desc: "Cathelicidin peptide", label: "ANTIMICROBIAL", price: "$110.00", img: "/images/products/vial.png", sectionId: "antimicrobial" },
        // ANTIOXIDANT
        { name: "Glutathione", desc: "Tripeptide antioxidant", label: "ANTIOXIDANT", price: "$110.00", img: "/images/products/vial.png", sectionId: "longevity" },
        // IMMUNE
        { name: "Thymalin", desc: "Thymic peptide bioregulator", label: "IMMUNE", price: "$85.00", img: "/images/products/vial.png", sectionId: "immune" },
        { name: "Thymosin Alpha-1", desc: "Thymic peptide", label: "IMMUNE", price: "From $110.00", img: "/images/products/vial.png", sectionId: "immune" },
        // LONGEVITY
        { name: "Epithalon", desc: "Tetrapeptide bioregulator", label: "LONGEVITY", price: "$60.00", img: "/images/products/vial.png", sectionId: "longevity" },
        // MITOCHONDRIAL
        { name: "MOTS-c", desc: "Mitochondrial-derived peptide", label: "MITOCHONDRIAL", price: "From $100.00", img: "/images/products/vial.png", sectionId: "mitochondrial" },
        { name: "NAD+", desc: "Nicotinamide adenine dinucleotide", label: "MITOCHONDRIAL", price: "$140.00", img: "/images/products/vial.png", sectionId: "mitochondrial" },
        { name: "SS-31", desc: "Elamipretide", label: "MITOCHONDRIAL", price: "From $120.00", img: "/images/products/vial.png", sectionId: "mitochondrial" },
        { name: "SLU-PP-332", desc: "ERR agonist", label: "MITOCHONDRIAL", price: "$165.00", img: "/images/products/vial.png", sectionId: "mitochondrial" },
        // NOOTROPIC
        { name: "Selank", desc: "Tuftsin-derived anxiolytic", label: "NOOTROPIC", price: "From $50.00", img: "/images/products/vial.png", sectionId: "nootropic" },
        { name: "Semax", desc: "ACTH-derived neuropeptide", label: "NOOTROPIC", price: "From $50.00", img: "/images/products/vial.png", sectionId: "nootropic" },
        { name: "Dihexa", desc: "HGF receptor agonist", label: "NOOTROPIC", price: "From $100.00", img: "/images/products/vial.png", sectionId: "nootropic" },
        { name: "Pinealon", desc: "Tripeptide bioregulator", label: "NOOTROPIC", price: "From $60.00", img: "/images/products/vial.png", sectionId: "nootropic" },
        { name: "Cerebrolysin", desc: "Neuropeptide preparation", label: "NOOTROPIC", price: "$70.00", img: "/images/products/vial.png", sectionId: "nootropic" },
        // NEUROPEPTIDE
        { name: "VIP", desc: "Vasoactive intestinal peptide", label: "NEUROPEPTIDE", price: "From $100.00", img: "/images/products/vial.png", sectionId: "neuropeptide" },
        // NEUROPROTECTIVE
        { name: "ARA-290", desc: "EPO-derived peptide", label: "NEUROPROTECTIVE", price: "$80.00", img: "/images/products/vial.png", sectionId: "neuropeptide" },
        // HORMONE
        { name: "Oxytocin", desc: "Neuropeptide hormone", label: "HORMONE", price: "$65.00", img: "/images/products/vial.png", sectionId: "hormone" },
        // REPRODUCTIVE
        { name: "HMG", desc: "Human menopausal gonadotropin", label: "REPRODUCTIVE", price: "$90.00", img: "/images/products/vial.png", sectionId: "reproductive" },
        { name: "Kisspeptin-10", desc: "GnRH stimulator", label: "REPRODUCTIVE", price: "From $80.00", img: "/images/products/vial.png", sectionId: "reproductive" },
        { name: "hCG", desc: "Human chorionic gonadotropin", label: "REPRODUCTIVE", price: "From $100.00", img: "/images/products/vial.png", sectionId: "reproductive" },
        // SEXUAL HEALTH
        { name: "PT-141", desc: "Bremelanotide", label: "SEXUAL HEALTH", price: "$90.00", img: "/images/products/vial.png", sectionId: "hormone" },
        // SLEEP
        { name: "DSIP", desc: "Delta sleep-inducing peptide", label: "SLEEP", price: "From $55.00", img: "/images/products/vial.png", sectionId: "sleep" },
        // TANNING
        { name: "Melanotan-1", desc: "Alpha-MSH analog", label: "TANNING", price: "$75.00", img: "/images/products/vial.png", sectionId: "tanning" },
        // RESEARCH
        { name: "Dermorphin", desc: "Opioid peptide", label: "RESEARCH", price: "$70.00", img: "/images/products/vial.png", sectionId: "research" },
        { name: "PNC-27", desc: "Anti-neoplastic peptide", label: "RESEARCH", price: "From $125.00", img: "/images/products/vial.png", sectionId: "research" },
        // SUPPLIES
        { name: "BAC Water", desc: "Bacteriostatic water", label: "SUPPLIES", price: "From $5.00", img: "/images/products/vial.png", sectionId: "supplies" },
        { name: "Sterile Water", desc: "Sterile water for injection", label: "SUPPLIES", price: "From $5.00", img: "/images/products/vial.png", sectionId: "supplies" },
        { name: "Acetic Acid", desc: "Reconstitution solution", label: "SUPPLIES", price: "$10.00", img: "/images/products/vial.png", sectionId: "supplies" },
        // STACKS
        { name: "Gut Health Stack", desc: "BPC-157 + KPV", label: "STACK", price: "$150.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Bloat Buster Stack", desc: "BPC-157 + Retatrutide", label: "STACK", price: "$305.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Belly Buster Stack", desc: "Retatrutide + Tesamorelin + BPC-157", label: "STACK", price: "$455.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Weight Loss Stack", desc: "Retatrutide + NAD+ + GHK-Cu", label: "STACK", price: "$345.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Baywatch Stack", desc: "Retatrutide + Melanotan-1 + BPC-157", label: "STACK", price: "$400.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Healing Stack", desc: "BPC-157 + TB-500 + KPV", label: "STACK", price: "$240.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Recovery Stack", desc: "BPC-157 + TB-500 + GHK-Cu", label: "STACK", price: "$270.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Anti-Aging Stack", desc: "Epithalon + NAD+ + GHK-Cu", label: "STACK", price: "$285.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Longevity Research Stack", desc: "Epithalon + NAD+ + SS-31", label: "STACK", price: "$250.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Growth Stack", desc: "CJC-1295 + Ipamorelin + NAD+", label: "STACK", price: "$300.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Cognitive Stack", desc: "Semax + Selank + Pinealon", label: "STACK", price: "$200.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Mental Wellness Stack", desc: "Semax + Selank + DSIP", label: "STACK", price: "$250.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Sleep Stack", desc: "DSIP + Pinealon + Epithalon", label: "STACK", price: "$160.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Glow Stack", desc: "GHK-Cu + TB-500 + BPC-157", label: "STACK", price: "$300.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Immune Support Stack", desc: "Thymosin Alpha-1 + Thymalin + KPV", label: "STACK", price: "$360.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Energy Stack", desc: "MOTS-c + SS-31 + NAD+", label: "STACK", price: "$340.00", img: "/images/products/vial.png", sectionId: "stacks" },
        { name: "Body Recomp Stack", desc: "Retatrutide + CJC w/DAC + Ipamorelin", label: "STACK", price: "$554.00", img: "/images/products/vial.png", sectionId: "stacks" },
      ];
    },

    search(query) {
      if (!query || query.length < 2) return [];
      const q = query.toLowerCase();
      return this.products
        .filter((p) => {
          return p.name.toLowerCase().includes(q) ||
                 p.desc.toLowerCase().includes(q) ||
                 p.label.toLowerCase().includes(q);
        })
        .slice(0, 8);
    },

    renderResults(results, query) {
      if (!this.searchResults) return;

      if (!query || query.length < 2) {
        this.searchResults.classList.remove("is-visible");
        this.searchResults.innerHTML = "";
        return;
      }

      if (results.length === 0) {
        this.searchResults.innerHTML = '<div class="search-no-results">No products found</div>';
        this.searchResults.classList.add("is-visible");
        return;
      }

      const isShopPage = window.location.pathname.includes("shop.html") || window.location.pathname.endsWith("/shop");
      const html = results.map((p) => {
        const href = isShopPage
          ? "#" + p.sectionId
          : "shop.html#" + p.sectionId;
        return '<a class="search-result-item" href="' + href + '" data-section="' + p.sectionId + '" data-name="' + p.name.replace(/"/g, '&quot;') + '">' +
          '<img src="' + p.img + '" alt="' + p.name.replace(/"/g, '&quot;') + '" />' +
          '<div class="search-result-info">' +
            '<div class="search-result-name">' + this.highlight(p.name, query) + '</div>' +
            '<div class="search-result-meta">' + p.label + '</div>' +
          '</div>' +
          '<span class="search-result-price">' + p.price + '</span>' +
        '</a>';
      }).join("");

      const viewAllHref = isShopPage ? "#" : "shop.html?q=" + encodeURIComponent(query);
      this.searchResults.innerHTML = html +
        '<a class="search-view-all" href="' + viewAllHref + '">View all results</a>';
      this.searchResults.classList.add("is-visible");
    },

    highlight(text, query) {
      const idx = text.toLowerCase().indexOf(query.toLowerCase());
      if (idx === -1) return text;
      return text.slice(0, idx) + '<strong>' + text.slice(idx, idx + query.length) + '</strong>' + text.slice(idx + query.length);
    },

    scrollToProduct(sectionId, productName) {
      const section = document.getElementById(sectionId);
      if (!section) return;

      // Scroll to section
      const navHeight = (document.querySelector(".shop-nav") || {}).offsetHeight || 0;
      const target = section.offsetTop - navHeight - 30;
      window.scrollTo({ top: target, behavior: "smooth" });

      // Highlight matching product card briefly
      if (productName) {
        const cards = section.querySelectorAll(".product-card");
        cards.forEach((card) => {
          const h3 = card.querySelector("h3");
          if (h3 && h3.textContent.trim() === productName) {
            card.style.transition = "box-shadow 0.3s ease";
            card.style.boxShadow = "0 0 0 3px var(--rose), " + (getComputedStyle(card).boxShadow || "none");
            setTimeout(() => {
              card.style.boxShadow = "";
            }, 2000);
          }
        });
      }
    },

    closeMobileSearch() {
      if (this.searchContainer) {
        this.searchContainer.classList.remove("is-mobile-open");
      }
      if (this.searchResults) {
        this.searchResults.classList.remove("is-visible");
      }
    },

    bindEvents() {
      let debounceTimer;
      const self = this;

      this.searchInput.addEventListener("input", function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          const query = self.searchInput.value.trim();
          const results = self.search(query);
          self.renderResults(results, query);
        }, 200);
      });

      this.searchInput.addEventListener("focus", function() {
        const query = self.searchInput.value.trim();
        if (query.length >= 2) {
          const results = self.search(query);
          self.renderResults(results, query);
        }
      });

      // Close results on outside click
      document.addEventListener("click", function(e) {
        if (self.searchContainer && !self.searchContainer.contains(e.target)) {
          if (self.searchResults) self.searchResults.classList.remove("is-visible");
          // Close mobile search when clicking outside
          if (window.innerWidth <= 1100) {
            self.closeMobileSearch();
          }
        }
      });

      // Handle result clicks on shop page — scroll to section
      if (this.searchResults) {
        this.searchResults.addEventListener("click", function(e) {
          const item = e.target.closest(".search-result-item");
          if (!item) return;

          const isShopPage = window.location.pathname.includes("shop.html") || window.location.pathname.endsWith("/shop");
          if (isShopPage) {
            e.preventDefault();
            const sectionId = item.dataset.section;
            const productName = item.dataset.name;
            self.scrollToProduct(sectionId, productName);
            self.searchResults.classList.remove("is-visible");
            self.searchInput.value = "";
            self.closeMobileSearch();
          }
        });
      }

      // Escape to close
      this.searchInput.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
          self.searchResults.classList.remove("is-visible");
          self.searchInput.blur();
          self.closeMobileSearch();
        }
        // Enter goes to first result
        if (e.key === "Enter") {
          e.preventDefault();
          var firstResult = self.searchResults.querySelector(".search-result-item");
          if (firstResult) firstResult.click();
        }
      });

      // Mobile search toggle
      if (this.mobileToggle) {
        this.mobileToggle.addEventListener("click", function() {
          if (self.searchContainer) {
            self.searchContainer.classList.toggle("is-mobile-open");
            if (self.searchContainer.classList.contains("is-mobile-open")) {
              document.body.classList.add("search-open");
              setTimeout(function() { self.searchInput.focus(); }, 100);
            } else {
              document.body.classList.remove("search-open");
            }
          }
        });
      }
    }
  };

  SiteSearch.init();

  // Wire shop-nav inline search to SiteSearch (shop page only)
  (function() {
    var shopInput = document.getElementById("shop-search-input");
    if (!shopInput || !SiteSearch.products.length) return;

    var debounce;
    shopInput.addEventListener("input", function() {
      clearTimeout(debounce);
      debounce = setTimeout(function() {
        var q = shopInput.value.trim();
        if (q.length < 2) {
          // Show all products again
          document.querySelectorAll(".product-card").forEach(function(c) { c.style.display = ""; });
          document.querySelectorAll("section[id] .section-heading").forEach(function(h) { h.style.display = ""; });
          return;
        }
        var results = SiteSearch.search(q);
        var matchNames = results.map(function(r) { return r.name.toLowerCase(); });
        var matchSections = new Set(results.map(function(r) { return r.sectionId; }));

        // Filter product cards to show only matches
        document.querySelectorAll(".product-card").forEach(function(card) {
          var h3 = card.querySelector("h3");
          var name = h3 ? h3.textContent.trim().toLowerCase() : "";
          card.style.display = matchNames.indexOf(name) >= 0 ? "" : "none";
        });

        // Scroll to first matching section
        if (results.length > 0 && results[0].sectionId) {
          SiteSearch.scrollToProduct(results[0].sectionId, results[0].name);
        }
      }, 250);
    });

    shopInput.addEventListener("keydown", function(e) {
      if (e.key === "Escape") {
        shopInput.value = "";
        shopInput.blur();
        document.querySelectorAll(".product-card").forEach(function(c) { c.style.display = ""; });
      }
      if (e.key === "Enter") {
        e.preventDefault();
        var q = shopInput.value.trim();
        var results = SiteSearch.search(q);
        if (results.length > 0 && results[0].sectionId) {
          SiteSearch.scrollToProduct(results[0].sectionId, results[0].name);
        }
      }
    });
  })();

  // ============================================
  // MARKETING POPUP (Admin-controlled, API-driven)
  // ============================================
  const MarketingPopup = {
    root: document.getElementById("marketing-popup-root"),
    config: null,
    overlay: null,
    popup: null,
    storagePrefix: "sbb_popup_",
    apiBase: window.SBB_API_BASE || (
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:3001/api/v1"
        : "https://api.sbbpeptides.com/api/v1"
    ),

    async init() {
      if (!this.root) return;

      // Determine current page name
      var pageName = window.location.pathname.split("/").pop() || "index.html";
      if (pageName === "" || pageName === "/") pageName = "index.html";

      // Fetch active popup config from admin API
      try {
        var res = await fetch(this.apiBase + "/support/popup/active?page=" + encodeURIComponent(pageName));
        if (!res.ok) return;
        this.config = await res.json();
      } catch (e) { return; }

      // No active popup
      if (!this.config || !this.config.id) return;

      // Frequency check
      var storageKey = this.storagePrefix + this.config.id;
      var freq = this.config.showFrequency || "once";
      if (freq === "once" && localStorage.getItem(storageKey)) return;
      if (freq === "session" && sessionStorage.getItem(storageKey)) return;

      // Build and show
      this.render();
      var delay = this.config.delayMs || 3500;
      setTimeout(function() { MarketingPopup.show(); }, delay);
    },

    render() {
      var c = this.config;

      // Build tier HTML
      var tiersHtml = "";
      if (c.tier1Label && c.tier1Value) {
        tiersHtml += '<div class="promo-tier"><div class="promo-tier-percent">' +
          this.esc(c.tier1Value) + '</div><div class="promo-tier-label">' +
          this.esc(c.tier1Label) + '</div></div>';
      }
      if (c.tier2Label && c.tier2Value) {
        tiersHtml += '<div class="promo-tier"><div class="promo-tier-percent">' +
          this.esc(c.tier2Value) + '</div><div class="promo-tier-label">' +
          this.esc(c.tier2Label) + '</div></div>';
      }

      // Build email form HTML (optional)
      var formHtml = "";
      if (c.showEmailCapture) {
        formHtml = '<div class="promo-form-wrap" id="promo-form-wrap">' +
          '<form class="promo-form" id="promo-form">' +
          '<input type="email" class="promo-email-input" id="promo-email" placeholder="Enter your email" required />' +
          '<button type="submit" class="promo-submit-btn" id="promo-submit-btn">' + this.esc(c.ctaText || "Unlock") + '</button>' +
          '</form>' +
          '<p class="promo-fine-print">No spam. Unsubscribe anytime. Discount applied at checkout.</p>' +
          '</div>';
      } else if (c.ctaLink) {
        formHtml = '<div style="text-align:center;margin-top:16px;">' +
          '<a href="' + this.esc(c.ctaLink) + '" class="btn btn-primary">' + this.esc(c.ctaText || "Shop Now") + '</a></div>';
      }

      // Build success state
      var successHtml = "";
      if (c.showEmailCapture) {
        var successHead = c.successHeadline || "You're In!";
        var successMsg = c.successMessage || "";
        var codeHtml = "";
        if (c.discountCode) {
          codeHtml = '<div class="promo-code-display">' + this.esc(c.discountCode) + '</div>';
        }
        successHtml = '<div class="promo-success" id="promo-success">' +
          '<h3>' + this.esc(successHead) + '</h3>' + codeHtml +
          (successMsg ? '<p>' + successMsg + '</p>' : '') +
          '<a href="shop.html" class="btn btn-primary">Start Shopping</a></div>';
      }

      // Assemble popup
      this.root.innerHTML =
        '<div class="promo-popup-overlay" id="promo-overlay"></div>' +
        '<div class="promo-popup" id="promo-popup">' +
        '<div class="promo-popup-card">' +
        '<button type="button" class="promo-popup-close" id="promo-close" aria-label="Close">&times;</button>' +
        '<div class="promo-popup-icon">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/><path d="M2 8h20v4H2z"/><path d="M12 20V8"/><path d="M12 8a4 3 0 0 0-4-3c-2 0-3.5 1.5-3.5 3S6 11 8 11h4"/><path d="M12 8a4 3 0 0 1 4-3c2 0 3.5 1.5 3.5 3s-1.5 3-3.5 3h-4"/></svg>' +
        '</div>' +
        '<h2>' + this.esc(c.headline) + '</h2>' +
        (c.subtitle ? '<p class="promo-subtitle">' + this.esc(c.subtitle) + '</p>' : '') +
        (c.bodyHtml || '') +
        (tiersHtml ? '<div class="promo-tiers">' + tiersHtml + '</div>' : '') +
        formHtml +
        successHtml +
        '</div></div>';

      this.overlay = document.getElementById("promo-overlay");
      this.popup = document.getElementById("promo-popup");
      this.bindEvents();
    },

    show() {
      if (!this.overlay || !this.popup) return;
      this.overlay.classList.add("is-visible");
      this.popup.classList.add("is-visible");
      document.body.style.overflow = "hidden";
    },

    hide() {
      if (!this.popup) return;
      this.popup.classList.remove("is-visible");
      this.popup.classList.add("is-closing");
      if (this.overlay) this.overlay.classList.remove("is-visible");

      setTimeout(function() {
        if (MarketingPopup.popup) MarketingPopup.popup.classList.remove("is-closing");
        document.body.style.overflow = "";
      }, 500);

      // Mark as shown
      var storageKey = this.storagePrefix + this.config.id;
      localStorage.setItem(storageKey, "true");
      sessionStorage.setItem(storageKey, "true");
    },

    async submitEmail(email) {
      var btn = document.getElementById("promo-submit-btn");
      if (btn) { btn.disabled = true; btn.textContent = "..."; }

      try {
        await fetch(this.apiBase + "/support/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, source: "popup_" + this.config.id })
        });
      } catch (e) { /* show success regardless */ }

      // Record conversion
      fetch(this.apiBase + "/support/popup/" + this.config.id + "/convert", {
        method: "POST"
      }).catch(function() {});

      this.showSuccess();
      localStorage.setItem("sbb_promo_email", email);
      var storageKey = this.storagePrefix + this.config.id;
      localStorage.setItem(storageKey, "true");
      sessionStorage.setItem(storageKey, "true");
    },

    showSuccess() {
      var wrap = document.getElementById("promo-form-wrap");
      var success = document.getElementById("promo-success");
      if (wrap) wrap.style.display = "none";
      setTimeout(function() {
        if (success) success.classList.add("is-visible");
        // Scroll popup to top so success content is visible on small screens
        var popup = document.getElementById("promo-popup");
        if (popup) popup.scrollTop = 0;
      }, 200);
    },

    bindEvents() {
      var self = this;
      var closeBtn = document.getElementById("promo-close");
      var form = document.getElementById("promo-form");
      var emailInput = document.getElementById("promo-email");

      if (closeBtn) {
        closeBtn.addEventListener("click", function() { self.hide(); });
      }
      if (this.overlay) {
        this.overlay.addEventListener("click", function() { self.hide(); });
      }
      document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && self.popup && self.popup.classList.contains("is-visible")) {
          self.hide();
        }
      });
      if (form) {
        form.addEventListener("submit", function(e) {
          e.preventDefault();
          var email = emailInput ? emailInput.value.trim() : "";
          if (email) self.submitEmail(email);
        });
      }
    },

    esc(str) {
      if (!str) return "";
      var d = document.createElement("div");
      d.textContent = str;
      return d.innerHTML;
    }
  };

  MarketingPopup.init();

  // ============================================
  // AFFILIATE & PARTNER FORM SUBMISSIONS
  // ============================================
  var API_BASE = window.SBB_API_BASE || "https://api.sbbpeptides.com/api/v1";

  // Helper: show feedback on form
  function showFormFeedback(form, message, isError) {
    var existing = form.querySelector(".form-feedback");
    if (existing) existing.remove();
    var div = document.createElement("div");
    div.className = "form-feedback" + (isError ? " form-feedback-error" : " form-feedback-success");
    div.textContent = message;
    div.style.cssText = "padding:12px 16px;margin:12px 0;border-radius:8px;font-size:14px;" +
      (isError ? "background:#fce4ec;color:#c62828;border:1px solid #ef9a9a;" : "background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;");
    form.prepend(div);
    div.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Affiliate form
  var affiliateForm = document.getElementById("affiliate-form");
  if (affiliateForm) {
    affiliateForm.addEventListener("submit", function(e) {
      e.preventDefault();
      var btn = affiliateForm.querySelector('button[type="submit"]');
      var originalText = btn.textContent;
      btn.textContent = "Submitting...";
      btn.disabled = true;

      // Parse social links from textarea into object
      var linksText = (document.getElementById("affiliate-links") || {}).value || "";
      var socialLinks = {};
      linksText.split(/[\n,]+/).forEach(function(line) {
        line = line.trim();
        if (!line) return;
        if (line.includes("instagram") || line.startsWith("@")) socialLinks.instagram = line;
        else if (line.includes("youtube")) socialLinks.youtube = line;
        else if (line.includes("tiktok")) socialLinks.tiktok = line;
        else if (line.includes("twitter") || line.includes("x.com")) socialLinks.twitter = line;
        else socialLinks.other = (socialLinks.other ? socialLinks.other + ", " : "") + line;
      });

      var formData = new FormData();
      formData.append("fullName", (document.getElementById("affiliate-name") || {}).value || "");
      formData.append("email", (document.getElementById("affiliate-email") || {}).value || "");
      formData.append("phone", (document.getElementById("affiliate-phone") || {}).value || "");
      formData.append("primaryPlatform", (document.getElementById("affiliate-platform") || {}).value || "");
      formData.append("socialLinks", JSON.stringify(socialLinks));
      formData.append("audienceSize", (document.getElementById("affiliate-audience") || {}).value || "");
      formData.append("contentFocus", (document.getElementById("affiliate-focus") || {}).value || "");
      formData.append("whyPartner", (document.getElementById("affiliate-notes") || {}).value || "");

      var resumeInput = document.getElementById("affiliate-resume");
      if (resumeInput && resumeInput.files[0]) {
        formData.append("resume", resumeInput.files[0]);
      }

      fetch(API_BASE + "/affiliates/apply", {
        method: "POST",
        body: formData
      })
      .then(function(res) { return res.json().then(function(data) { return { ok: res.ok, data: data }; }); })
      .then(function(result) {
        if (result.ok) {
          showFormFeedback(affiliateForm, "Application submitted successfully! We will review and get back to you soon.", false);
          affiliateForm.reset();
        } else {
          showFormFeedback(affiliateForm, result.data.message || "Something went wrong. Please try again.", true);
        }
      })
      .catch(function() {
        showFormFeedback(affiliateForm, "Network error. Please check your connection and try again.", true);
      })
      .finally(function() {
        btn.textContent = originalText;
        btn.disabled = false;
      });
    });
  }

  // Partner form
  var partnerForm = document.getElementById("partner-form");
  if (partnerForm) {
    partnerForm.addEventListener("submit", function(e) {
      e.preventDefault();
      var btn = partnerForm.querySelector('button[type="submit"]');
      var originalText = btn.textContent;
      btn.textContent = "Submitting...";
      btn.disabled = true;

      var formData = new FormData();
      formData.append("organizationName", (document.getElementById("org-name") || {}).value || "");
      formData.append("contactName", (document.getElementById("contact-name") || {}).value || "");
      formData.append("email", (document.getElementById("contact-email") || {}).value || "");
      formData.append("phone", (document.getElementById("contact-phone") || {}).value || "");
      formData.append("orgType", (document.getElementById("org-type") || {}).value || "");
      formData.append("website", (document.getElementById("org-website") || {}).value || "");
      formData.append("location", (document.getElementById("org-location") || {}).value || "");
      formData.append("partnershipFocus", (document.getElementById("partner-interest") || {}).value || "");
      formData.append("partnershipOverview", (document.getElementById("partner-notes") || {}).value || "");

      var docsInput = document.getElementById("partner-documents");
      if (docsInput && docsInput.files.length > 0) {
        for (var i = 0; i < docsInput.files.length; i++) {
          formData.append("documents", docsInput.files[i]);
        }
      }

      fetch(API_BASE + "/partners/apply", {
        method: "POST",
        body: formData
      })
      .then(function(res) { return res.json().then(function(data) { return { ok: res.ok, data: data }; }); })
      .then(function(result) {
        if (result.ok) {
          showFormFeedback(partnerForm, "Partnership inquiry submitted! Our team will review and reach out shortly.", false);
          partnerForm.reset();
        } else {
          showFormFeedback(partnerForm, result.data.message || "Something went wrong. Please try again.", true);
        }
      })
      .catch(function() {
        showFormFeedback(partnerForm, "Network error. Please check your connection and try again.", true);
      })
      .finally(function() {
        btn.textContent = originalText;
        btn.disabled = false;
      });
    });
  }
});
