import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Support page for Science Based Body.',
};

export default function Page() {
  return <LegacyMainContent fileName="support.html" />;
}
