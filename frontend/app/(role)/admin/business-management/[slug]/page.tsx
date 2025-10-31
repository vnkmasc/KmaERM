import BusinessDetailView from '@/components/role/admin/business-management/business-detail-view'

interface Props {
  params: Promise<{ slug: string }>
}

const BusinessDetailPage = async ({ params }: Props) => {
  const { slug } = await params

  return <BusinessDetailView id={slug} />
}

export default BusinessDetailPage
