import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { cn, showNotification } from '@/lib/utils/common'
import LicenseService from '@/services/go/license.service'
import { AlertDialogAction, AlertDialogDescription } from '@/components/ui/alert-dialog'
import { UploadIcon } from 'lucide-react'
import useSWRMutation from 'swr/mutation'

interface Props {
  isTableAction?: boolean
  licenseId: string
  refetch?: () => void
  hasFile: boolean
  licenseCode: string
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
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size={props.isTableAction ? 'icon' : 'default'}
          title='Tải giấy phép lên blockchain'
          className={cn(props.isTableAction && 'rounded-none')}
          isLoading={mutateUploadBlockchain.isMutating}
        >
          <UploadIcon />
          {props.isTableAction ? null : <span className='hidden md:block'>Blockchain</span>}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Đẩy giấy phép lên blockchain</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn đẩy giấy phép <b>{props.licenseCode}</b> lên blockchain không?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
          <AlertDialogAction onClick={() => mutateUploadBlockchain.trigger()}>Xác nhận</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default UploadBlockchainButton
