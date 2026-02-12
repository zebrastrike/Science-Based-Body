import LegacyStyles from '@/components/legacy/LegacyStyles';
import BodyClass from '@/components/legacy/BodyClass';
import LegacyScripts from '@/components/legacy/LegacyScripts';
import AccountContent from './AccountContent';

export const metadata = {
  title: 'My Account | Science Based Body',
  description: 'Manage your Science Based Body account, addresses, and orders.',
};

export default function AccountPage() {
  return (
    <>
      <LegacyStyles />
      <BodyClass className="page-policy" />
      <LegacyScripts />
      <AccountContent />
    </>
  );
}
