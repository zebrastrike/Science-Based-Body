import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Research Use Only Disclaimer',
  description: 'Research Use Only Disclaimer page for Science Based Body.',
};

export default function Page() {
  return <LegacyMainContent fileName="research-use.html" />;
}
