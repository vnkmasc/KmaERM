import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogDescription,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogAction
} from '@/components/ui/alert-dialog'

import { FileIcon, TrashIcon, UserRoundPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PencilIcon } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import { ButtonGroup } from '@/components/ui/button-group'
import { IBusiness } from '@/types/business'
import UploadBusinessCertificate from './upload-business-certificate'
import useSWRMutation from 'swr/mutation'
import BusinessService from '@/services/go/business.service'

interface Props {
  item: IBusiness
  // eslint-disable-next-line no-unused-vars
  onDelete: (id: string) => void
  onSetIdDetail: Dispatch<SetStateAction<string | null | undefined>>
  onSetUpdateBusinessSetup: Dispatch<SetStateAction<{ businessCode: string; id: string } | undefined>>
}

const TableActions: React.FC<Props> = (props) => {
  const mutateViewCertificate = useSWRMutation(
    'business-certificate-view',
    () => BusinessService.getRegistrationCertificate(props.item.id),
    {
      onSuccess: (data) => {
        // Tạo URL từ Blob
        const blobUrl = URL.createObjectURL(data)

        // Mở file trong tab mới
        const newWindow = window.open(blobUrl, '_blank')

        // Revoke URL sau khi window được load để giải phóng bộ nhớ
        // hoặc sau 1 phút nếu window không mở được
        if (newWindow) {
          newWindow.onload = () => {
            URL.revokeObjectURL(blobUrl)
          }
        } else {
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl)
          }, 60000)
        }
      }
    }
  )
  return (
    <ButtonGroup>
      <Button
        variant='outline'
        size='icon'
        onClick={() => props.onSetIdDetail(props.item.id)}
        title='Chỉnh sửa thông tin cơ bản'
      >
        <PencilIcon />
      </Button>
      <Button
        size='icon'
        title='Chỉnh sửa mã số doanh nghiệp'
        onClick={() => props.onSetUpdateBusinessSetup({ businessCode: props.item.businessCode, id: props.item.id })}
      >
        <UserRoundPen />
      </Button>
      <UploadBusinessCertificate isTableAction businessId={props.item.id} />
      <Button
        variant={'outline'}
        size={'icon'}
        title='Xem giấy chứng nhận'
        disabled={!props.item.certificateFilePath}
        isLoading={mutateViewCertificate.isMutating}
        onClick={() => mutateViewCertificate.trigger()}
      >
        <FileIcon />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant='destructive' size='icon' title='Xóa doanh nghiệp'>
            <TrashIcon />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa doanh nghiệp</AlertDialogTitle>
            <AlertDialogDescription>
              Doanh nghiệp có ID <b>{props.item.id}</b> sẽ bị xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={() => props.onDelete(props.item.id)}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ButtonGroup>
  )
}

export default TableActions
