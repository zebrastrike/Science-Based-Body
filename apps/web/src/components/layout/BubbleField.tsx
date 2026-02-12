'use client';

import { useEffect, useRef } from 'react';

const BUBBLE_COUNT = 20;

interface BubbleState {
  el: HTMLElement;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  seed: number;
  isPopping: boolean;
}

export default function BubbleField() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const bubbles = Array.from(field.querySelectorAll('.bubble')) as HTMLElement[];
    if (!bubbles.length) return;

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
        .map(node => node.getBoundingClientRect())
        .filter(rect => rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight);
    };

    const scheduleRefresh = () => { needsRefresh = true; };
    window.addEventListener('resize', scheduleRefresh, { passive: true });
    window.addEventListener('scroll', scheduleRefresh, { passive: true });

    const state: BubbleState[] = bubbles.map(el => {
      const size = el.offsetWidth;
      const startX = el.offsetLeft;
      const startY = el.offsetTop;
      el.style.left = '0px';
      el.style.top = '0px';
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 0.8;
      el.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;
      return { el, size, x: startX, y: startY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, seed: Math.random() * Math.PI * 2, isPopping: false };
    });

    const popDuration = 420;
    const respawn = (b: BubbleState) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      b.x = Math.max(0, Math.random() * (w - b.size));
      b.y = Math.max(0, Math.random() * (h - b.size));
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 0.8;
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;
      b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
    };

    const pop = (b: BubbleState) => {
      if (b.isPopping) return;
      b.isPopping = true;
      b.el.classList.add('is-popping');
      setTimeout(() => {
        respawn(b);
        b.el.classList.remove('is-popping');
        b.isPopping = false;
      }, popDuration);
    };

    const handlePop = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, select, label, [role='button'], .modal, .site-nav")) return;
      for (const b of state) {
        if (b.isPopping) continue;
        const r = b.size / 2;
        const dx = e.clientX - (b.x + r);
        const dy = e.clientY - (b.y + r);
        if (dx * dx + dy * dy <= r * r) { pop(b); break; }
      }
    };

    window.addEventListener('pointerdown', handlePop, { passive: true });

    let lastTime = performance.now();
    let frame = 0;

    const animate = (time: number) => {
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

      state.forEach(b => {
        if (b.isPopping) return;
        const t = time * 0.001;
        const s = b.seed;
        const ds = 0.05;
        const driftX = (Math.sin(t * 0.15 + s) * 0.55 + Math.sin(t * 0.28 + s * 1.3) * 0.3 + Math.sin(t * 0.45 + s * 2.1) * 0.15) * ds;
        const driftY = (Math.cos(t * 0.13 + s * 0.8) * 0.5 + Math.cos(t * 0.24 + s * 1.5) * 0.3 + Math.cos(t * 0.4 + s * 1.9) * 0.2) * ds;

        b.x += (b.vx + driftX) * dt;
        b.y += (b.vy + driftY) * dt;

        // Wall bounce
        if (b.x <= 0) { b.x = 0; b.vx = Math.abs(b.vx) * 0.92; }
        if (b.x + b.size >= width) { b.x = width - b.size; b.vx = -Math.abs(b.vx) * 0.92; }
        if (b.y <= 0) { b.y = 0; b.vy = Math.abs(b.vy) * 0.92; }
        if (b.y + b.size >= height) { b.y = height - b.size; b.vy = -Math.abs(b.vy) * 0.92; }

        // Obstacle collision
        for (const rect of obstacles) {
          const left = rect.left - pad;
          const right = rect.right + pad;
          const top = rect.top - pad;
          const bottom = rect.bottom + pad;

          if (b.x + b.size > left && b.x < right && b.y + b.size > top && b.y < bottom) {
            const ox = Math.min(b.x + b.size - left, right - b.x);
            const oy = Math.min(b.y + b.size - top, bottom - b.y);
            const bf = 0.85;

            if (ox < oy) {
              b.x = b.x + b.size / 2 < (left + right) / 2 ? left - b.size : right;
              b.vx *= -bf;
            } else {
              b.y = b.y + b.size / 2 < (top + bottom) / 2 ? top - b.size : bottom;
              b.vy *= -bf;
            }
            b.vx += (Math.random() - 0.5) * 0.2;
            b.vy += (Math.random() - 0.5) * 0.2;
          }
        }

        // Speed clamp
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        const maxSpeed = 0.9;
        if (speed > maxSpeed) { const sc = maxSpeed / speed; b.vx *= sc; b.vy *= sc; }
        if (speed < 0.03) {
          const a = Math.random() * Math.PI * 2;
          b.vx += Math.cos(a) * 0.05;
          b.vy += Math.sin(a) * 0.05;
        }

        const pulse = 1 + Math.sin(t * 0.35 + s * 2) * 0.035;
        b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) scale(${pulse})`;
      });

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', scheduleRefresh);
      window.removeEventListener('scroll', scheduleRefresh);
      window.removeEventListener('pointerdown', handlePop);
    };
  }, []);

  return (
    <div className="bubble-field" aria-hidden="true" ref={fieldRef}>
      {Array.from({ length: BUBBLE_COUNT }, (_, i) => (
        <span key={i} className={`bubble bubble-${i + 1}`} />
      ))}
    </div>
  );
}
