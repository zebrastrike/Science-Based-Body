import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Wholesale Shop',
  description: 'Wholesale research peptide catalog for verified partners.',
};

export default function Page() {
  return <LegacyMainContent fileName="wholesale-shop.html" />;
}
