import LegacyStyles from '@/components/legacy/LegacyStyles';
import BodyClass from '@/components/legacy/BodyClass';
import LegacyScripts from '@/components/legacy/LegacyScripts';
import OrdersContent from './OrdersContent';

export const metadata = {
  title: 'My Orders | Science Based Body',
  description: 'Track your Science Based Body orders and view shipping updates.',
};

export default function TrackingPage() {
  return (
    <>
      <LegacyStyles />
      <BodyClass className="page-policy" />
      <LegacyScripts />
      <OrdersContent />
    </>
  );
}
