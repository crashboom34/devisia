import ProjectDetailClient from './ProjectDetailClient';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ProjectDetailClient projectId={id} />;
}
