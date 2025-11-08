import LicenseDetailView from '@/components/role/admin/license-management/license-detail-view'

interface Props {
  params: Promise<{ slug: string }>
}

const BusinessDetailPage = async ({ params }: Props) => {
  const { slug } = await params

  return <LicenseDetailView id={slug} />
}

export default BusinessDetailPage
