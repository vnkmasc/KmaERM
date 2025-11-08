import { Button } from '@/components/ui/button'
import { cn, showNotification } from '@/lib/utils/common'
import LicenseService from '@/services/go/license.service'
import { UploadIcon } from 'lucide-react'
import useSWRMutation from 'swr/mutation'

interface Props {
  isTableAction?: boolean
  licenseId: string
  refetch?: () => void
  hasFile: boolean
}

const UploadBlockchainButton: React.FC<Props> = (props) => {
  const mutateUploadBlockchain = useSWRMutation(
    'license-upload-blockchain',
    () => LicenseService.uploadBlockchainLicense(props.licenseId),
    {
      onSuccess: () => {
        showNotification('success', 'Tải giấy phép lên blockchain thành công')
        props.refetch?.()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Tải lên giấy phép lên blockchain thất bại')
      }
    }
  )

  return (
    <Button
      size={props.isTableAction ? 'icon' : 'default'}
      title='Tải giấy phép lên blockchain'
      isLoading={mutateUploadBlockchain.isMutating}
      className={cn(props.isTableAction && 'rounded-none')}
      onClick={() => {
        if (props.hasFile) {
          mutateUploadBlockchain.trigger()
        } else {
          showNotification('warning', 'Giấy phép chưa có tệp, vui lòng tải tệp lên')
        }
      }}
    >
      <UploadIcon />
      {props.isTableAction ? null : <span className='hidden md:block'>Blockchain</span>}
    </Button>
  )
}

export default UploadBlockchainButton
