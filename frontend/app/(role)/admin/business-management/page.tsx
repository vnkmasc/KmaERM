'use client'

import CustomPagination from '@/components/role/admin/common/custom-pagination'
import CustomTable from '@/components/role/admin/common/custom-table'
import PageHeader from '@/components/common/page-header'
import UpdateBusinessCodeDialog from '@/components/role/admin/business-management/update-business-code-dialog'
import UpdateBusinessDialog from '@/components/role/admin/business-management/update-business-dialog'
import Filter from '@/components/role/admin/common/filter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitialSearchParamsToObject, showNotification, windowOpenBlankBlob } from '@/lib/utils/common'
import BusinessService from '@/services/go/business.service'
import { IBusinessSearchParams, IUpdateBusinessSetup } from '@/types/business'
import { EyeIcon, FileIcon, PencilIcon, PlusIcon, TrashIcon, UserRoundPen } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { ButtonGroup } from '@/components/ui/button-group'
import UploadBusinessCertificate from '@/components/role/admin/business-management/upload-business-certificate'
import DeleteAlertDialog from '@/components/role/admin/common/delete-alert-dialog'

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
      viet_tat: filter.shortName,
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

  const mutateViewCertificate = useSWRMutation(
    'business-certificate-view',
    (_, { arg }: { arg: string }) => BusinessService.getRegistrationCertificate(arg),
    {
      onSuccess: (data) => windowOpenBlankBlob(data),
      onError: (error) => {
        showNotification('error', error.message || 'Xem giấy chứng nhận thất bại')
      }
    }
  )

  return (
    <div className='space-y-2 md:space-y-4'>
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
          { type: 'input', name: 'shortName', placeholder: 'Nhập tên viết tắt' },
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
          {
            header: 'Tên doanh nghiệp (VI)',
            value: 'viName',
            className: 'min-w-[200px] font-semibold text-blue-500',
            render: (item) => <Link href={`/admin/business-management/${item.id}`}>{item.viName}</Link>
          },
          { header: 'Tên viết tắt', value: 'shortName' },
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
          // {
          //   header: 'Trạng thái',
          //   value: 'status',
          //   render: (item) =>
          //     item.status ? <Badge>Hoạt động</Badge> : <Badge variant='destructive'>Ngừng hoạt động</Badge>
          // },
          {
            header: 'Hành động',
            value: 'action',
            render: (item) => (
              <ButtonGroup>
                <Link href={`/admin/business-management/${item.id}`}>
                  <Button size={'icon'} title='Xem chi tiết toàn bộ thông tin doanh nghiệp' className='rounded-r-none!'>
                    <EyeIcon />
                  </Button>
                </Link>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setIdDetail(item.id)}
                  title='Chỉnh sửa thông tin cơ bản'
                >
                  <PencilIcon />
                </Button>
                <Button
                  size='icon'
                  title='Chỉnh sửa mã số doanh nghiệp'
                  onClick={() => setUpdateBusinessSetup({ businessCode: item.businessCode, id: item.id })}
                >
                  <UserRoundPen />
                </Button>
                <UploadBusinessCertificate isTableAction businessId={item.id} refetch={querySearchBusinesses.mutate} />
                <Button
                  variant={'outline'}
                  size={'icon'}
                  title='Xem giấy chứng nhận'
                  // disabled={!props.item.certificateFilePath}
                  isLoading={mutateViewCertificate.isMutating}
                  onClick={() => {
                    if (item.certificateFilePath) {
                      mutateViewCertificate.trigger(item.id)
                    } else {
                      showNotification('warning', 'Doanh nghiệp chưa có giấy chứng nhận')
                    }
                  }}
                >
                  <FileIcon />
                </Button>
                <DeleteAlertDialog
                  description={
                    <span>
                      Doanh nghiệp <b>{item.viName}</b> sẽ bị xóa khỏi hệ thống, thao tác này không thể hoàn tác.
                    </span>
                  }
                  onDelete={() => mutateDeleteBusiness.trigger(item.id)}
                  title='Xóa doanh nghiệp'
                >
                  <Button variant='destructive' size='icon' title='Xóa doanh nghiệp'>
                    <TrashIcon />
                  </Button>
                </DeleteAlertDialog>
              </ButtonGroup>
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
        onClose={() => setIdDetail(undefined)}
        refetch={querySearchBusinesses.mutate}
        businessDetail={queryBusinessDetail.data}
      />
      <UpdateBusinessCodeDialog
        refetch={querySearchBusinesses.mutate}
        updateBusinessSetup={updateBusinessSetup}
        onClose={() => setUpdateBusinessSetup(undefined)}
      />
    </div>
  )
}

export default BusinessManagementPage
