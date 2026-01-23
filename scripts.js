document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("is-ready");

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
        seed: Math.random() * Math.PI * 2
      };
    });

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
  if (!modal) return;

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
});
