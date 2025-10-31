'use client'

import CustomPagination from '@/components/common/custom-pagination'
import CustomTable from '@/components/common/custom-table'
import PageHeader from '@/components/common/page-header'
import TableActions from '@/components/role/admin/business-management/table-actions'
import UpdateBusinessCodeDialog from '@/components/role/admin/business-management/update-business-code-dialog'
import UpdateBusinessDialog from '@/components/role/admin/business-management/update-business-dialog'
import Filter from '@/components/role/admin/common/filter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitialSearchParamsToObject, showNotification } from '@/lib/utils/common'
import BusinessService from '@/services/go/business.service'
import { IBusinessSearchParams, IUpdateBusinessSetup } from '@/types/business'
import { PlusIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'

const BusinessManagementPage = () => {
  const parseSearchParamsToObject = getInitialSearchParamsToObject()
  const defaultFilter = {
    ...parseSearchParamsToObject,
    page: Number(parseSearchParamsToObject.page) || 1
  }
  const [filter, setFilter] = useState<IBusinessSearchParams>(defaultFilter)
  const [idDetail, setIdDetail] = useState<string | undefined | null>(undefined)
  const [updateBusinessSetup, setUpdateBusinessSetup] = useState<IUpdateBusinessSetup | undefined>(undefined)

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
      page: filter.page || 1
    })
  )

  const queryBusinessDetail = useSWR(idDetail, () => BusinessService.getBusinessById(idDetail as string))

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
            header: 'Giấy chứng nhận',
            value: 'certificateFilePath',
            render: (item) =>
              item.certificateFilePath ? <Badge>Đã có</Badge> : <Badge variant='destructive'>Chưa có</Badge>
          },
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
              <TableActions
                item={item}
                onDelete={mutateDeleteBusiness.trigger}
                onSetIdDetail={setIdDetail}
                onSetUpdateBusinessSetup={setUpdateBusinessSetup}
              />
            )
          }
        ]}
      />
      <CustomPagination
        page={querySearchBusinesses.data?.page}
        totalPage={querySearchBusinesses.data?.total}
        onChangePage={handleChangePage}
      />
      <UpdateBusinessDialog
        idDetail={idDetail}
        onSetIdDetail={setIdDetail}
        refetchSearchList={querySearchBusinesses.mutate}
        businessDetail={queryBusinessDetail.data}
      />
      <UpdateBusinessCodeDialog
        refetchSearchList={querySearchBusinesses.mutate}
        updateBusinessSetup={updateBusinessSetup}
        onSetUpdateBusinessSetup={setUpdateBusinessSetup}
      />
    </div>
  )
}

export default BusinessManagementPage
