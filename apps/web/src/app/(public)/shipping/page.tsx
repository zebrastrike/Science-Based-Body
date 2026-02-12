import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Shipping Policy page for Science Based Body.',
};

export default function Page() {
  return <LegacyMainContent fileName="shipping.html" />;
}
