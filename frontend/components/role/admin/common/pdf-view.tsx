'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { useEffect } from 'react'
import useSWR from 'swr'

interface Props {
  queryFn: () => Promise<Blob>
  idKey: string
}

const PdfView: React.FC<Props> = (props) => {
  const queryFile = useSWR(
    'pdf-view-' + props.idKey,
    async () => {
      const res = await props.queryFn()
      const blobUrl = URL.createObjectURL(res)

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 100)

      return blobUrl
    },
    {
      revalidateOnFocus: false
    }
  )

  useEffect(() => {
    if (queryFile.data) {
      return () => {
        URL.revokeObjectURL(queryFile.data as string)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return queryFile.isLoading ? (
    <Skeleton className='h-[300px] w-full md:h-[500px]' />
  ) : queryFile.error ? (
    <Alert variant='destructive' className='mx-auto max-w-[700px]'>
      <AlertCircle />
      <AlertTitle>Đã có lỗi khi tải tệp</AlertTitle>
      <AlertDescription>{queryFile.error.message}</AlertDescription>
    </Alert>
  ) : (
    <iframe src={queryFile.data} className='h-[500px] w-full md:h-[700px]' />
  )
}

export default PdfView
