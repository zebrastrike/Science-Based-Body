import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Brand Partnerships',
  description: 'Partner with Science Based Body for wholesale research peptide supply.',
};

export default function Page() {
  return <LegacyMainContent fileName="brand-partnerships.html" />;
}
