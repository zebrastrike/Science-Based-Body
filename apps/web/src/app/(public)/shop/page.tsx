import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';
import ShopInteractivity from './ShopInteractivity';

export const metadata: Metadata = {
  title: 'Shop Research Peptides',
  description: 'Browse our catalog of 99%+ purity research peptides with certificates of analysis.',
};

export default function Page() {
  return (
    <>
      <LegacyMainContent fileName="shop.html" />
      <ShopInteractivity />
    </>
  );
}
