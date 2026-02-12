import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'COA Verification',
  description: 'COA Verification page for Science Based Body.',
};

export default function Page() {
  return <LegacyMainContent fileName="coa-verification.html" />;
}
