import ProjectDetailClient from './ProjectDetailClient';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

interface PageProps {
  params: {
    id: string;
  };
}

export default function ProjectDetailPage({ params }: PageProps) {
  return <ProjectDetailClient projectId={params.id} />;
}
