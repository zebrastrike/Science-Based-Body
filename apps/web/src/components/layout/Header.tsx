'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useCartContext } from '@/contexts/CartContext';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/product', label: 'Peptide Library' },
  { href: '/branded-for-science', label: 'Branded for Science' },
  { href: '/brand-partnerships', label: 'Brand Partners & Affiliates' },
];

export default function Header() {
  const { itemCount, openDrawer } = useCartContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on resize above mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  // Escape key closes menu and search
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => { document.body.classList.remove('menu-open'); };
  }, [menuOpen]);

  const toggleMenu = useCallback(() => setMenuOpen(prev => !prev), []);

  const handleMobileSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  return (
    <>
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="container header-grid">
          <Link className="logo" href="/">
            <img src="/logo.png" alt="Science Based Body" />
          </Link>

          {/* Desktop Search */}
          <div className="site-search" id="site-search">
            <input
              ref={searchRef}
              type="text"
              className="site-search-input"
              placeholder="Search peptides..."
              autoComplete="off"
              aria-label="Search products"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="button" className="site-search-btn" aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            <div className="search-results" id="search-results" />
          </div>

          {/* Hamburger */}
          <button
            className="menu-toggle"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            <span className="menu-icon" />
          </button>

          {/* Mobile search icon */}
          <button
            type="button"
            className="mobile-search-toggle"
            aria-label="Search"
            onClick={handleMobileSearch}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          {/* Navigation */}
          <nav className={`site-nav${menuOpen ? ' is-open' : ''}`}>
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                onClick={() => setTimeout(() => setMenuOpen(false), 100)}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              className="cart-toggle"
              data-cart-toggle=""
              aria-label="Open cart"
              onClick={openDrawer}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6h15l-1.5 9h-12z" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
                <path d="M6 6L5 3H2" />
              </svg>
              <span className={`cart-badge${itemCount === 0 ? ' is-hidden' : ''}`}>
                {itemCount}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Nav overlay for mobile menu */}
      {menuOpen && (
        <div className="nav-overlay is-visible" onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
}
