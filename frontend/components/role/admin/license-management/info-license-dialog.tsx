import { isDateISOBefore, showNotification } from '@/lib/utils/common'
import LicenseService from '@/services/go/license.service'
import { ILicense } from '@/types/license'
import useSWRMutation from 'swr/mutation'
import DetailDialog from '../common/detail-dialog'
import { LICENSE_STATUS_OPTIONS, LICENSE_TYPE_OPTIONS } from '@/constants/license'
import { validateNoEmpty } from '@/lib/utils/validators'
import { IOption } from '@/types/form-field'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2Icon } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  data: ILicense | undefined
  idDetail: string | null | undefined
  onClose: () => void
  refetch?: () => void
  dossierCodes: IOption[]
}

const InfoLicenseDialog: React.FC<Props> = (props) => {
  const mutateUpdateLicense = useSWRMutation(
    'license-update',
    (_, { arg }: { arg: ILicense }) => LicenseService.updateLicense(props.idDetail!, arg),
    {
      onSuccess: () => {
        showNotification('success', 'Cập nhật giấy phép thành công')
        props.refetch?.()
        props.onClose()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Cập nhật giấy phép thất bại')
      }
    }
  )

  const mutateCreateLicense = useSWRMutation(
    'license-create',
    (_, { arg }: { arg: ILicense }) => LicenseService.createLicense(arg),
    {
      onSuccess: () => {
        showNotification('success', 'Tạo giấy phép thành công')
        props.refetch?.()
        props.onClose()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Tạo giấy phép thất bại')
      }
    }
  )

  const handleSubmitDialog = (data: ILicense) => {
    if (isDateISOBefore(data.expirationDate, data.effectiveDate)) {
      showNotification('warning', 'Ngày hiệu lực phải trước ngày hết hạn')
      return
    }
    if (props.idDetail) {
      mutateUpdateLicense.trigger(data)
    } else {
      mutateCreateLicense.trigger(data)
    }
  }

  return (
    <DetailDialog
      mode={props.idDetail ? 'update' : props.idDetail === undefined ? undefined : 'create'}
      title={props.idDetail ? 'Chi tiết giấy phép' : 'Tạo giấy phép'}
      onClose={() => {
        props.onClose()
      }}
      onSubmit={(data) => handleSubmitDialog(data)}
      defaultValues={
        props.data || {
          dossierId: '',
          licenseType: '',
          licenseCode: '',
          licenseStatus: 'HieuLuc',
          effectiveDate: format(new Date(), 'yyyy-MM-dd'),
          expirationDate: ''
        }
      }
      beforeContent={
        <Alert variant={'success'}>
          <CheckCircle2Icon />
          <AlertTitle>Sẵn sàng {props.idDetail ? 'chỉnh sửa' : 'tạo'} giấy phép cho doanh nghiệp</AlertTitle>
        </Alert>
      }
      items={[
        {
          name: 'dossierId',
          label: 'Mã hồ sơ',
          type: 'select',
          required: true,
          placeholder: 'Chọn mã hồ sơ',
          validator: validateNoEmpty,
          setting: {
            select: {
              groups: [{ label: 'Mã hồ sơ', options: props.dossierCodes ?? [] }]
            }
          }
        },
        {
          name: 'licenseType',
          label: 'Loại giấy phép',
          placeholder: 'Chọn loại giấy phép',
          type: 'select',
          required: true,
          setting: {
            select: {
              groups: [
                {
                  label: 'Loại giấy phép',
                  options: LICENSE_TYPE_OPTIONS
                }
              ]
            }
          },
          validator: validateNoEmpty
        },
        {
          name: 'licenseCode',
          label: 'Mã giấy phép',
          type: 'input',
          required: true,
          placeholder: 'Nhập mã giấy phép'
        },
        {
          name: 'licenseStatus',
          label: 'Trạng thái giấy phép',
          placeholder: 'Chọn trạng thái giấy phép',
          type: 'select',
          required: true,
          setting: {
            select: {
              groups: [
                {
                  label: 'Trạng thái',
                  options: LICENSE_STATUS_OPTIONS
                }
              ]
            }
          },
          disabled: props.idDetail ? false : true,
          description: props.idDetail ? undefined : 'Không thể chỉnh sửa khi tạo giấy phép, mặc định là "Hiệu lực"'
        },
        {
          name: 'effectiveDate',
          label: 'Ngày hiệu lực',
          type: 'input',
          required: true,
          setting: { input: { type: 'date' } }
        },
        {
          name: 'expirationDate',
          label: 'Ngày hết hạn',
          type: 'input',
          required: true,
          setting: { input: { type: 'date' } }
        }
      ]}
    />
  )
}

export default InfoLicenseDialog
