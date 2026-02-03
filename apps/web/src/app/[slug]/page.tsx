import { notFound } from 'next/navigation';
import LegacyPage from '@/components/legacy/LegacyPage';
import { readLegacyFile } from '@/components/legacy/legacyFiles';

interface LegacySlugPageProps {
  params: { slug: string };
}

export default function LegacySlugPage({ params }: LegacySlugPageProps) {
  const fileName = `${params.slug}.html`;

  try {
    readLegacyFile(fileName);
  } catch {
    notFound();
  }

  return <LegacyPage fileName={fileName} />;
}
