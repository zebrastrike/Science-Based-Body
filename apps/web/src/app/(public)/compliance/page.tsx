import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Compliance Program',
  description: 'Compliance Program page for Science Based Body.',
};

export default function Page() {
  return <LegacyMainContent fileName="compliance.html" />;
}
