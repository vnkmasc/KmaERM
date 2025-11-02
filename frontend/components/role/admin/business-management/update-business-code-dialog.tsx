import { showNotification } from '@/lib/utils/common'
import BusinessService from '@/services/go/business.service'
import { IUpdateBusinessCode, IUpdateBusinessSetup } from '@/types/business'
import useSWRMutation from 'swr/mutation'
import DetailDialog from '../common/detail-dialog'
import { validateBusinessCode } from '@/lib/utils/validators'

interface Props {
  refetch?: () => void
  updateBusinessSetup: IUpdateBusinessSetup | undefined
  onClose: () => void
}

const UpdateBusinessCodeDialog: React.FC<Props> = (props) => {
  const mutateChangeBusinessCode = useSWRMutation(
    'business-change-code',
    (_, { arg }: { arg: IUpdateBusinessCode }) =>
      BusinessService.changeBusinessCode(props.updateBusinessSetup!.id, arg),
    {
      onSuccess: () => {
        showNotification('success', 'Thay đổi mã số doanh nghiệp thành công')
        props.refetch?.()
        props.onClose()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Thay đổi mã số doanh nghiệp thất bại')
      }
    }
  )

  return (
    <DetailDialog
      mode={props.updateBusinessSetup ? 'update' : undefined}
      items={[
        {
          name: 'newBusinessCode',
          label: 'Mã số doanh nghiệp mới',
          type: 'input',
          required: true,
          placeholder: 'Nhập mã số doanh nghiệp',
          validator: validateBusinessCode
        },
        {
          name: 'changedDate',
          label: 'Ngày thay đổi',
          type: 'input',
          setting: { input: { type: 'date' } },
          required: true
        },
        {
          name: 'issuedBy',
          label: 'Nơi cấp giấy tờ',
          type: 'input',
          required: true,
          placeholder: 'Nhập nơi cấp giấy tờ'
        }
      ]}
      title='Cập nhật mã số doanh nghiệp'
      onClose={() => {
        props.onClose()
      }}
      onSubmit={(data) => mutateChangeBusinessCode.trigger(data)}
      defaultValues={{
        newBusinessCode: props.updateBusinessSetup?.businessCode
      }}
    />
  )
}

export default UpdateBusinessCodeDialog
