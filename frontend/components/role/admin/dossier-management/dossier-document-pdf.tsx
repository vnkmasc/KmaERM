import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import DossierService from '@/services/go/dossier.service'
import { AlertCircle } from 'lucide-react'
import useSWR from 'swr'

interface Props {
  documentId: string
}

const DossierDocumentPdf: React.FC<Props> = (props) => {
  const queryDossierDocumentPdf = useSWR(
    props.documentId,
    async () => {
      const res = await DossierService.viewDossierDocument(props.documentId)

      const iframUrl = URL.createObjectURL(res)

      setTimeout(() => {
        URL.revokeObjectURL(iframUrl)
      }, 5000)

      return iframUrl
    },
    {
      revalidateOnFocus: false
    }
  )
  return queryDossierDocumentPdf.isLoading ? (
    <Skeleton className='h-[300px] w-full md:h-[500px]' />
  ) : queryDossierDocumentPdf.error ? (
    <Alert variant='destructive' className='mx-auto max-w-[700px]'>
      <AlertCircle />
      <AlertTitle>Đã có lỗi khi tải tài liệu hồ sơ</AlertTitle>
      <AlertDescription>{queryDossierDocumentPdf.error.message}</AlertDescription>
    </Alert>
  ) : (
    <iframe src={queryDossierDocumentPdf.data} className='h-[500px] w-full md:h-[700px]' />
  )
}

export default DossierDocumentPdf
