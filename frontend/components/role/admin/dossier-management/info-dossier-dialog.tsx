import { isDateAfterNow, isDateISOBefore, showNotification } from '@/lib/utils/common'
import DossierService from '@/services/go/dossier.service'
import { IDossier, IDossierDialogData } from '@/types/dossier'
import useSWRMutation from 'swr/mutation'
import DetailDialog from '../common/detail-dialog'
import { DOSSIER_STATUS_OPTIONS, DOSSIER_TYPE_OPTIONS } from '@/constants/dossier'
import BeforeContentInfoDialog from './before-content-info-dialog'
import { format } from 'date-fns'
import { validateNoEmpty } from '@/lib/utils/validators'

interface Props {
  data: IDossier | undefined
  idDetail: string | null | undefined
  onClose: () => void
  refetch?: () => void
  businessId: string
  businessName: string
}

const InfoDossierDialog: React.FC<Props> = (props) => {
  const mutateCreateDossier = useSWRMutation(
    'dossier-create',
    (_, { arg }: { arg: IDossierDialogData }) => DossierService.createDossier(arg, props.businessId),
    {
      onSuccess: () => {
        showNotification('success', 'Tạo hồ sơ thành công')
        props.refetch?.()
        props.onClose()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Tạo hồ sơ thất bại')
      }
    }
  )

  const mutateUpdateDossier = useSWRMutation(
    'dossier-update',
    (_, { arg }: { arg: IDossierDialogData }) => DossierService.updateDossier(props.idDetail!, arg),
    {
      onSuccess: () => {
        showNotification('success', 'Cập nhật hồ sơ thành công')
        props.refetch?.()
        props.onClose()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Cập nhật hồ sơ thất bại')
      }
    }
  )

  const handleSubmitDialog = (data: IDossierDialogData) => {
    if (isDateAfterNow(data.issuedDate, true)) {
      showNotification('warning', 'Ngày đăng ký không được lớn hơn ngày hiện tại')
      return
    }
    if (isDateISOBefore(data.issuedDate, data.receivedDate)) {
      showNotification('warning', 'Ngày đăng ký phải trước ngày tiếp nhận')
      return
    }
    if (isDateISOBefore(data.receivedDate, data.expectedReturnDate)) {
      showNotification('warning', 'Ngày tiếp nhận phải trước ngày hẹn trả')
      return
    }
    if (props.idDetail) {
      mutateUpdateDossier.trigger(data)
    } else {
      mutateCreateDossier.trigger(data)
    }
  }

  return (
    <DetailDialog
      mode={props.idDetail ? 'update' : props.idDetail === undefined ? undefined : 'create'}
      title={props.idDetail ? 'Chi tiết hồ sơ' : 'Tạo hồ sơ'}
      onClose={props.onClose}
      onSubmit={handleSubmitDialog}
      beforeContent={
        <BeforeContentInfoDialog
          businessName={props.businessName}
          isUpdateMode={props.idDetail ? true : false}
          dossierCode={props.data?.dossierCode}
        />
      }
      defaultValues={
        props.data || {
          dossierType: '',
          dossierStatus: 'MoiTao',
          issuedDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          receivedDate: '',
          expectedReturnDate: ''
        }
      }
      items={[
        {
          name: 'dossierType',
          label: 'Loại hồ sơ',
          type: 'select',
          placeholder: 'Chọn loại hồ sơ',
          required: true,
          setting: {
            select: {
              groups: [
                {
                  label: 'Phân loại',
                  options: DOSSIER_TYPE_OPTIONS
                }
              ]
            }
          },
          description: props.idDetail ? 'Không thể thay đổi sau khi tạo hồ sơ' : undefined,
          disabled: props.idDetail ? true : false,
          validator: validateNoEmpty
        },
        {
          name: 'dossierStatus',
          label: 'Trạng thái hồ sơ',
          placeholder: 'Chọn trạng thái hồ sơ',
          type: 'select',
          required: true,
          setting: {
            select: {
              groups: [
                {
                  label: 'Trạng thái',
                  options: DOSSIER_STATUS_OPTIONS
                }
              ]
            }
          },
          disabled: props.idDetail ? false : true,
          description: props.idDetail ? undefined : 'Không thể chỉnh sửa khi tạo hồ sơ, mặc định là "Mới tạo"'
        },
        {
          name: 'issuedDate',
          label: 'Ngày đăng ký',
          type: 'input',
          required: true,
          setting: { input: { type: 'datetime-local' } }
        },
        {
          name: 'receivedDate',
          label: 'Ngày tiếp nhận',
          type: 'input',
          required: true,
          setting: { input: { type: 'datetime-local' } }
        },
        {
          name: 'expectedReturnDate',
          label: 'Ngày hẹn trả',
          type: 'input',
          required: true,
          setting: { input: { type: 'datetime-local' } }
        }
      ]}
    />
  )
}

export default InfoDossierDialog
