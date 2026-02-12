import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/support', label: 'Support' },
  { href: '/faq', label: 'FAQ' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/returns', label: 'Returns' },
  { href: '/tracking', label: 'Order Tracking' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/accessibility', label: 'Accessibility' },
  { href: '/testing-standards', label: 'Quality Assurance' },
  { href: '/storage-guidelines', label: 'Storage Guidelines' },
  { href: '/coa-verification', label: 'COA Verification' },
  { href: '/research-use', label: 'Research Use Only' },
  { href: '/compliance', label: 'Compliance' },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">
            <Link className="footer-logo" href="/">
              <img src="/logo.png" alt="Science Based Body" />
            </Link>
            <span className="label">SCIENCE BASED BODY</span>
          </div>
          <p>Research peptide supply with transparent batch standards.</p>
        </div>
        <div className="footer-links">
          {FOOTER_LINKS.map(link => (
            <Link key={link.href} href={link.href} className="text-link">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
