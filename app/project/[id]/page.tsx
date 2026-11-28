import ProjectDetailClient from './ProjectDetailClient';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ devis?: string | string[] }>;
}

export default async function ProjectDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, { devis }] = await Promise.all([params, searchParams]);
  const focusedQuoteId = typeof devis === 'string' ? devis : undefined;
  return <ProjectDetailClient key={`${id}:${focusedQuoteId ?? ''}`} projectId={id} focusedQuoteId={focusedQuoteId} />;
}
