import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import BubbleField from '@/components/layout/BubbleField';
import BackToTop from '@/components/layout/BackToTop';
import PageInteractivity from '@/components/layout/PageInteractivity';
import LegacyStyles from '@/components/legacy/LegacyStyles';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LegacyStyles />
      <BubbleField />
      <Header />
      {children}
      <Footer />
      <CartDrawer />
      <BackToTop />
      <PageInteractivity />
      <div id="marketing-popup-root" />
    </>
  );
}
