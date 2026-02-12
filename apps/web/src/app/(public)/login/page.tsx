import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';
import LoginInteractivity from './LoginInteractivity';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your Science Based Body account.',
};

export default function Page() {
  return (
    <>
      <LegacyMainContent fileName="login.html" />
      <LoginInteractivity />
    </>
  );
}
