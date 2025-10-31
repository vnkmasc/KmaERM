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

import { TrashIcon, UserRoundPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PencilIcon } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import { ButtonGroup } from '@/components/ui/button-group'

interface Props {
  id: string
  // eslint-disable-next-line no-unused-vars
  onDelete: (id: string) => void
  onSetIdDetail: Dispatch<SetStateAction<string | null | undefined>>
}

const TableActions: React.FC<Props> = (props) => {
  return (
    <ButtonGroup>
      <Button
        variant='outline'
        size='icon'
        onClick={() => props.onSetIdDetail(props.id)}
        title='Chỉnh sửa thông tin cơ bản'
      >
        <PencilIcon />
      </Button>
      <Button size='icon' title='Chỉnh sửa mã số doanh nghiệp'>
        <UserRoundPen />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant='destructive' size='icon' title='Xóa doanh nghiệp'>
            <TrashIcon />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Doanh nghiệp</AlertDialogTitle>
            <AlertDialogDescription>
              Doanh nghiệp có ID <b>{props.id}</b> sẽ bị xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={() => props.onDelete(props.id)}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ButtonGroup>
  )
}

export default TableActions
