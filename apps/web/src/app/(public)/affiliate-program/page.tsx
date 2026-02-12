import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Affiliate Program',
  description: 'Join the Science Based Body affiliate program and earn commissions on referrals.',
};

export default function Page() {
  return <LegacyMainContent fileName="affiliate-program.html" />;
}
