import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Science Based Body research peptides.',
};

export default function Page() {
  return <LegacyMainContent fileName="faq.html" />;
}
