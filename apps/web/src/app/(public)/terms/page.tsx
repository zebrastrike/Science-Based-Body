import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service page for Science Based Body.',
};

export default function Page() {
  return <LegacyMainContent fileName="terms.html" />;
}
