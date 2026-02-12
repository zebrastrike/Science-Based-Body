import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy page for Science Based Body.',
};

export default function Page() {
  return <LegacyMainContent fileName="privacy.html" />;
}
