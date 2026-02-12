import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Storage Guidelines',
  description: 'Storage Guidelines page for Science Based Body.',
};

export default function Page() {
  return <LegacyMainContent fileName="storage-guidelines.html" />;
}
