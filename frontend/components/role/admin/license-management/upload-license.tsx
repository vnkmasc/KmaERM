import { showNotification } from '@/lib/utils/common'
import useSWRMutation from 'swr/mutation'
import UploadButton from '../common/upload-button'
import { UploadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LicenseService from '@/services/go/license.service'

interface Props {
  isTableAction?: boolean
  licenseId: string
  refetch: () => void
}

const UploadLicense: React.FC<Props> = (props) => {
  const mutateUploadLicense = useSWRMutation(
    'license-upload',
    (_, { arg }: { arg: FormData }) => LicenseService.uploadLicenseFile(props.licenseId, arg),
    {
      onSuccess: () => {
        showNotification('success', 'Tải giấy phép thành công')
        props.refetch()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Tải giấy phép thất bại')
      }
    }
  )

  return (
    <UploadButton onUpload={(file: FormData) => mutateUploadLicense.trigger(file)} accept='.pdf'>
      <Button
        variant={'secondary'}
        size={props.isTableAction ? 'icon' : 'default'}
        title='Thêm/cập nhật giấy phép'
        isLoading={mutateUploadLicense.isMutating}
      >
        <UploadIcon />
        {props.isTableAction ? null : <span className='hidden md:block'>Tải giấy phép</span>}
      </Button>
    </UploadButton>
  )
}

export default UploadLicense
