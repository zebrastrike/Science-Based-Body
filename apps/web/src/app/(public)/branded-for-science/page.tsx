import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Branded for Science',
  description: 'Our science-first approach to research peptide quality and testing standards.',
};

export default function Page() {
  return <LegacyMainContent fileName="branded-for-science.html" />;
}
