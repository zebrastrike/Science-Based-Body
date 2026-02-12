import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Quality Assurance',
  description: 'Quality Assurance page for Science Based Body.',
};

export default function Page() {
  return <LegacyMainContent fileName="testing-standards.html" />;
}
