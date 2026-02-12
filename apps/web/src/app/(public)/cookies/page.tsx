import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Cookie Policy page for Science Based Body.',
};

export default function Page() {
  return <LegacyMainContent fileName="cookies.html" />;
}
