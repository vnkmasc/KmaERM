import { cn, showNotification } from '@/lib/utils/common'
import BusinessService from '@/services/go/business.service'
import useSWRMutation from 'swr/mutation'
import UploadButton from '../common/upload-button'
import { UploadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  isTableAction?: boolean
  businessId: string
}

const UploadBusinessCertificate: React.FC<Props> = (props) => {
  const mutateUploadBusinessCertificate = useSWRMutation(
    'business-upload-certificate',
    (_, { arg }: { arg: FormData }) => BusinessService.uploadRegistrationCertificate(props.businessId, arg),
    {
      onSuccess: () => {
        showNotification('success', 'Tải giấy chứng nhận đăng ký kinh doanh thành công')
      },
      onError: (error) => {
        showNotification('error', error.message || 'Tải giấy chứng nhận đăng ký kinh doanh thất bại')
      }
    }
  )

  return (
    <UploadButton onUpload={(file: FormData) => mutateUploadBusinessCertificate.trigger(file)} accept='.pdf'>
      <Button
        variant={'secondary'}
        size='icon'
        title='Thêm/cập nhật giấy chứng nhận đăng ký kinh doanh'
        isLoading={mutateUploadBusinessCertificate.isMutating}
        className={cn(props.isTableAction && 'rounded-none')}
      >
        <UploadIcon />
        {props.isTableAction ? null : <span className='hidden md:block'>Tải GCN</span>}
      </Button>
    </UploadButton>
  )
}

export default UploadBusinessCertificate
