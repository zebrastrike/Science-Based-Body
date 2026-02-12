import { Metadata } from 'next';
import LegacyMainContent from '@/components/legacy/LegacyMainContent';
import LibraryInteractivity from './LibraryInteractivity';

export const metadata: Metadata = {
  title: 'Peptide Library',
  description: 'Browse our comprehensive peptide research library organized by category.',
};

export default function Page() {
  return (
    <>
      <LegacyMainContent fileName="product.html" />
      <LibraryInteractivity />
    </>
  );
}
