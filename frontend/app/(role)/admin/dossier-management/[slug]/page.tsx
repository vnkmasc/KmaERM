import DossierDetailView from '@/components/role/admin/dossier-management/dossier-detail-view'

interface Props {
  params: Promise<{ slug: string }>
}

const BusinessDetailPage = async ({ params }: Props) => {
  const { slug } = await params

  return <DossierDetailView id={slug} />
}

export default BusinessDetailPage
