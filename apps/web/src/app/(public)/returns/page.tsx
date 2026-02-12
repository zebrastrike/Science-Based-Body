import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Return & Refund Policy',
  description: 'Return & Refund Policy page for Science Based Body.',
};

export default function Page() {
  return <LegacyMainContent fileName="returns.html" />;
}
