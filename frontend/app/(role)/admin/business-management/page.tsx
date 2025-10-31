'use client'

import CustomPagination from '@/components/common/custom-pagination'
import CustomTable from '@/components/common/custom-table'
import PageHeader from '@/components/common/page-header'
import TableActions from '@/components/role/admin/business-management/table-actions'
import DetailDialog from '@/components/role/admin/common/detail-dialog'
import Filter from '@/components/role/admin/common/filter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitialSearchParamsToObject, showNotification } from '@/lib/utils/common'
import {
  validateBusinessCode,
  validateCommonName,
  validatePersonalName,
  validateVNIPhoneNumber,
  validateWebsite
} from '@/lib/utils/validators'
import BusinessService from '@/services/go/business.service'
import { IBusiness } from '@/types/business'
import { PlusIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'

const BusinessManagementPage = () => {
  const defaultFilter = getInitialSearchParamsToObject()
  const [filter, setFilter] = useState<any>(defaultFilter)
  const [idDetail, setIdDetail] = useState<string | undefined | null>(undefined)

  const handleChangePage = useCallback(
    (page: number) => {
      setFilter({ ...filter, page })
    },
    [filter]
  )

  const querySearchBusinesses = useSWR('business' + JSON.stringify(filter), () =>
    BusinessService.searchBusinesses({
      viet_tat: filter.abbreviation,
      ten_vi: filter.viName,
      ten_en: filter.enName,
      ma_so: filter.businessCode,
      page: Number(filter.page) || 1
    })
  )

  const queryBusinessDetail = useSWR(idDetail, () => BusinessService.getBusinessById(idDetail as string))

  const mutateUpdateBusiness = useSWRMutation(
    'business-update',
    (_, { arg }: { arg: IBusiness }) => BusinessService.updateBusiness(idDetail!, arg),
    {
      onSuccess: () => {
        showNotification('success', 'Cập nhật doanh nghiệp thành công')
        querySearchBusinesses.mutate()
        setIdDetail(undefined)
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
        querySearchBusinesses.mutate()
        setIdDetail(undefined)
      },
      onError: (error) => {
        showNotification('error', error.message || 'Tạo doanh nghiệp thất bại')
      }
    }
  )

  const mutateDeleteBusiness = useSWRMutation(
    'business-delete',
    (_, { arg }: { arg: string }) => BusinessService.deleteBusiness(arg),
    {
      onSuccess: () => {
        showNotification('success', 'Xóa doanh nghiệp thành công')
        querySearchBusinesses.mutate()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Xóa doanh nghiệp thất bại')
      }
    }
  )

  const handleSubmitDialog = (data: any) => {
    if (idDetail) {
      mutateUpdateBusiness.trigger(data)
    } else {
      mutateCreateBusiness.trigger(data)
    }
  }

  return (
    <div>
      <PageHeader
        title='Quản lý doanh nghiệp'
        actions={[
          <Button key='add-business' onClick={() => setIdDetail(null)}>
            <PlusIcon /> <span className='hidden md:block'>Tạo mới</span>
          </Button>
        ]}
      />
      <Filter
        items={[
          { type: 'input', name: 'abbreviation', placeholder: 'Nhập tên viết tắt' },
          { type: 'input', name: 'viName', placeholder: 'Nhập tên tiếng việt' },
          { type: 'input', name: 'enName', placeholder: 'Nhập tên tiếng anh' },
          {
            type: 'input',
            name: 'businessCode',
            placeholder: 'Nhập mã số doanh nghiệp'
          }
        ]}
        refreshQuery={querySearchBusinesses.mutate}
        onFilter={setFilter}
        defaultValues={defaultFilter}
      />
      <CustomTable
        data={querySearchBusinesses.data?.data || []}
        items={[
          { header: 'Tên doanh nghiệp (VI)', value: 'viName', className: 'min-w-[200px] font-semibold text-main' },
          { header: 'Tên viết tắt', value: 'abbreviation' },
          { header: 'Mã số doanh nghiệp', value: 'businessCode', className: 'min-w-[150px] font-semibold text-main' },
          { header: 'Người đại diện', value: 'legalRepresentative' },
          { header: 'Chức vụ', value: 'position', render: (item) => <Badge>{item.position}</Badge> },
          { header: 'Số điện thoại', value: 'phoneNumber' },
          { header: 'Email', value: 'email' },
          {
            header: 'Trạng thái',
            value: 'status',
            render: (item) =>
              item.status ? <Badge>Hoạt động</Badge> : <Badge variant='destructive'>Ngừng hoạt động</Badge>
          },
          {
            header: 'Hành động',
            value: 'action',
            render: (item) => (
              <TableActions id={item.id} onDelete={mutateDeleteBusiness.trigger} onSetIdDetail={setIdDetail} />
            )
          }
        ]}
      />
      <CustomPagination
        page={querySearchBusinesses.data?.page}
        totalPage={querySearchBusinesses.data?.total}
        onChangePage={handleChangePage}
      />
      <DetailDialog
        mode={idDetail ? 'update' : idDetail === undefined ? undefined : 'create'}
        title='Chi tiết doanh nghiệp'
        onClose={() => {
          setIdDetail(undefined)
        }}
        onSubmit={(data) => handleSubmitDialog(data)}
        defaultValues={queryBusinessDetail.data || {}}
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
            name: 'abbreviation',
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
            disabled: idDetail ? true : false,
            description: idDetail ? 'Không thể thay đổi khi chỉnh sửa thông tin cơ bản' : undefined
          },
          {
            name: 'firstIssuedDate',
            label: 'Ngày cấp lần đầu MSDN',
            type: 'input',
            required: true,
            placeholder: 'Nhập ngày cấp lần đầu MSDN',
            setting: {
              input: { type: 'date' }
            }
          },
          { name: 'issuedBy', label: 'Nơi cấp MSDN', type: 'input', required: true, placeholder: 'Nhập nơi cấp MSDN' },
          {
            name: 'phoneNumber',
            label: 'Số điện thoại',
            type: 'input',
            validator: validateVNIPhoneNumber,
            placeholder: 'Nhập số điện thoại'
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
            setting: { input: { type: 'date' } },
            placeholder: 'Nhập ngày cấp giấy tờ'
          },
          { name: 'idIssuedBy', label: 'Nơi cấp giấy tờ', type: 'input', placeholder: 'Nhập nơi cấp giấy tờ' },
          {
            name: 'status',
            label: 'Trạng thái hoạt động',
            type: 'switch',
            description: 'Bật nếu doanh nghiệp đang hoạt động'
          }
        ]}
      />
    </div>
  )
}

export default BusinessManagementPage
