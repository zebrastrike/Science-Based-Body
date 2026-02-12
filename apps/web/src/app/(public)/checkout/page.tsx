import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your research peptide order.',
};

export default function Page() {
  return <LegacyMainContent fileName="checkout.html" />;
}
