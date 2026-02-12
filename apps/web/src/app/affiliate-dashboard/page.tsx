import LegacyStyles from '@/components/legacy/LegacyStyles';
import BodyClass from '@/components/legacy/BodyClass';
import LegacyScripts from '@/components/legacy/LegacyScripts';
import AffiliateDashboardContent from './AffiliateDashboardContent';

export const metadata = {
  title: 'Affiliate Dashboard | Science Based Body',
  description: 'Manage your affiliate account, track referrals, and view commissions.',
};

export default function AffiliateDashboardPage() {
  return (
    <>
      <LegacyStyles />
      <BodyClass className="page-policy" />
      <LegacyScripts />
      <AffiliateDashboardContent />
    </>
  );
}
