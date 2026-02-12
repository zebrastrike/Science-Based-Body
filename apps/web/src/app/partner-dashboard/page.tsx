import LegacyStyles from '@/components/legacy/LegacyStyles';
import BodyClass from '@/components/legacy/BodyClass';
import LegacyScripts from '@/components/legacy/LegacyScripts';
import PartnerDashboardContent from './PartnerDashboardContent';

export const metadata = {
  title: 'Partner Dashboard | Science Based Body',
  description: 'Manage your brand partner account, documents, and wholesale catalog.',
};

export default function PartnerDashboardPage() {
  return (
    <>
      <LegacyStyles />
      <BodyClass className="page-policy" />
      <LegacyScripts />
      <PartnerDashboardContent />
    </>
  );
}
