import { showNotification } from '@/lib/utils/common'
import BusinessService from '@/services/go/business.service'
import { IBusiness } from '@/types/business'
import useSWRMutation from 'swr/mutation'
import DetailDialog from '../common/detail-dialog'
import {
  validateBusinessCode,
  validateCommonName,
  validatePersonalName,
  validateVNIPhoneNumber,
  validateWebsite
} from '@/lib/utils/validators'

interface Props {
  data: IBusiness | undefined
  idDetail: string | null | undefined
  onClose: () => void
  refetch?: () => void
}

const InfoBusinessDialog: React.FC<Props> = (props) => {
  const mutateUpdateBusiness = useSWRMutation(
    'business-update',
    (_, { arg }: { arg: IBusiness }) => BusinessService.updateBusiness(props.idDetail!, arg),
    {
      onSuccess: () => {
        showNotification('success', 'Cập nhật doanh nghiệp thành công')
        props.refetch?.()
        props.onClose()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Cập nhật doanh nghiệp thất bại')
      }
    }
  )

  const mutateCreateBusiness = useSWRMutation(
    'business-create',
    (_, { arg }: { arg: IBusiness }) => BusinessService.createBusiness(arg),
    {
      onSuccess: () => {
        showNotification('success', 'Tạo doanh nghiệp thành công')
        props.refetch?.()
        props.onClose()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Tạo doanh nghiệp thất bại')
      }
    }
  )
  const handleSubmitDialog = (data: any) => {
    if (props.idDetail) {
      mutateUpdateBusiness.trigger(data)
    } else {
      mutateCreateBusiness.trigger(data)
    }
  }

  return (
    <DetailDialog
      mode={props.idDetail ? 'update' : props.idDetail === undefined ? undefined : 'create'}
      title={props.idDetail ? 'Chi tiết doanh nghiệp' : 'Tạo doanh nghiệp'}
      onClose={() => {
        props.onClose()
      }}
      onSubmit={(data) => handleSubmitDialog(data)}
      defaultValues={props.data || {}}
      items={[
        {
          name: 'viName',
          label: 'Tên doanh nghiệp (VI)',
          type: 'input',
          required: true,
          placeholder: 'Nhập tên doanh nghiệp (VI)',
          validator: validateCommonName
        },
        {
          name: 'enName',
          label: 'Tên doanh nghiệp (EN)',
          type: 'input',
          placeholder: 'Nhập tên doanh nghiệp (EN)',
          validator: validateCommonName
        },
        {
          name: 'shortName',
          label: 'Tên viết tắt',
          type: 'input',
          placeholder: 'Nhập tên viết tắt',
          validator: validateCommonName
        },
        { name: 'address', label: 'Địa chỉ', type: 'input', required: true, placeholder: 'Nhập địa chỉ' },
        {
          name: 'businessCode',
          label: 'Mã số doanh nghiệp',
          type: 'input',
          required: true,
          placeholder: 'Nhập mã số doanh nghiệp',
          validator: validateBusinessCode,
          disabled: props.idDetail ? true : false,
          description: props.idDetail ? 'Không thể thay đổi khi chỉnh sửa thông tin cơ bản' : undefined
        },
        {
          name: 'firstIssuedDate',
          label: 'Ngày cấp lần đầu MSDN',
          type: 'input',
          setting: { input: { type: 'date' } },
          required: true,
          placeholder: 'Nhập ngày cấp lần đầu MSDN',
          disabled: props.idDetail ? true : false,
          description: props.idDetail ? 'Không thể thay đổi sau khi tạo doanh nghiệp' : undefined
        },
        { name: 'issuedBy', label: 'Nơi cấp MSDN', type: 'input', required: true, placeholder: 'Nhập nơi cấp MSDN' },
        {
          name: 'phoneNumber',
          label: 'Số điện thoại',
          type: 'input',
          validator: validateVNIPhoneNumber,
          placeholder: 'Nhập số điện thoại',
          description: 'Số điện thoại vùng Việt Nam'
        },
        {
          name: 'email',
          label: 'Email',
          type: 'input',
          setting: { input: { type: 'email' } },
          placeholder: 'Nhập email'
        },
        { name: 'website', label: 'Website', type: 'input', placeholder: 'Nhập website', validator: validateWebsite },
        {
          name: 'charterCapital',
          label: 'Vốn điều lệ (VND)',
          type: 'input',
          placeholder: 'Nhập vốn điều lệ (VND)',
          setting: { input: { type: 'number' } }
        },
        {
          name: 'legalRepresentative',
          label: 'Người đại diện pháp luật',
          type: 'input',
          placeholder: 'Nhập người đại diện pháp luật',
          validator: validatePersonalName
        },
        { name: 'position', label: 'Chức vụ', type: 'input', placeholder: 'Nhập chức vụ' },
        { name: 'idType', label: 'Loại giấy tờ', type: 'input', placeholder: 'Nhập loại giấy tờ' },
        {
          name: 'idIssuedDate',
          label: 'Ngày cấp giấy tờ',
          type: 'input',
          setting: { input: { type: 'date' } }
        },
        { name: 'idIssuedBy', label: 'Nơi cấp giấy tờ', type: 'input', placeholder: 'Nhập nơi cấp giấy tờ' }
        // {
        //   name: 'status',
        //   label: 'Trạng thái hoạt động',
        //   type: 'switch',
        //   description: 'Bật nếu doanh nghiệp đang hoạt động'
        // }
      ]}
    />
  )
}

export default InfoBusinessDialog
