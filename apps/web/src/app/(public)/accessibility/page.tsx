import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Accessibility Statement',
  description: 'Accessibility Statement page for Science Based Body.',
};

export default function Page() {
  return <LegacyMainContent fileName="accessibility.html" />;
}
