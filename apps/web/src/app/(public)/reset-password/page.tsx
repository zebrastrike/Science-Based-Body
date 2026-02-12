import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your Science Based Body account password.',
};

export default function Page() {
  return <LegacyMainContent fileName="reset-password.html" />;
}
