import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Science Based Body and our commitment to research peptide quality.',
};

export default function Page() {
  return <LegacyMainContent fileName="about.html" />;
}
