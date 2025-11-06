'use client'

import PageHeader from '@/components/common/page-header'
import CustomPagination from '@/components/role/admin/common/custom-pagination'
import CustomTable from '@/components/role/admin/common/custom-table'
import DeleteAlertDialog from '@/components/role/admin/common/delete-alert-dialog'
import Filter from '@/components/role/admin/common/filter'
import InfoLicenseDialog from '@/components/role/admin/license-management/info-license-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { LICENSE_STATUS_OPTIONS, LICENSE_TYPE_OPTIONS } from '@/constants/license'
import { parseDateInputToISO, searchParamsToObject, showNotification } from '@/lib/utils/common'
import BusinessService from '@/services/go/business.service'
import LicenseService from '@/services/go/license.service'
import { ILicenseSearchParams } from '@/types/license'
import { PencilIcon, TrashIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'

const LicenseManagementPage: React.FC = () => {
  // Sử dụng search params khiến cho default value của select không bị lỗi
  const searchParams = useSearchParams()
  const initialParams = useMemo(() => searchParamsToObject(searchParams), [searchParams])
  const defaultFilter = {
    ...initialParams,
    page: Number(initialParams.page) || 1
  }

  const [filter, setFilter] = useState<ILicenseSearchParams>(defaultFilter)
  const [idDetail, setIdDetail] = useState<string | undefined | null>(undefined)

  const querySearchLicenses = useSWR(filter.businessId ? 'license' + JSON.stringify(filter) : undefined, () =>
    LicenseService.searchLicenses({
      doanh_nghiep_id: filter.businessId,
      ma_giay_phep: filter.licenseCode,
      ma_ho_so: filter.dossierCode,
      loai_giay_phep: filter.licenseType,
      trang_thai_giay_phep: filter.licenseStatus,
      ngay_hieu_luc_from: parseDateInputToISO(filter.effectiveDateFrom),
      ngay_hieu_luc_to: parseDateInputToISO(filter.effectiveDateTo),
      ngay_het_han_from: parseDateInputToISO(filter.expirationDateFrom),
      ngay_het_han_to: parseDateInputToISO(filter.expirationDateTo),
      page: filter.page
    })
  )

  const queryLicenseDetail = useSWR(idDetail, () => LicenseService.getLicenseById(idDetail as string))

  const mutateDeleteLicense = useSWRMutation(
    'license-delete',
    (_, { arg }: { arg: string }) => LicenseService.deleteLicense(arg),
    {
      onSuccess: () => {
        showNotification('success', 'Xóa giấy phép thành công')
        querySearchLicenses.mutate()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Xóa giấy phép thất bại')
      }
    }
  )

  const handleChangePage = (page: number) => {
    setFilter({ ...filter, page })
  }

  return (
    <div className='space-y-2 md:space-y-4'>
      <PageHeader title='Quản lý giấy phép' />

      <Filter
        onFilter={setFilter}
        refetch={querySearchLicenses.mutate}
        defaultValues={defaultFilter}
        items={[
          {
            type: 'query_select',
            name: 'businessId',
            placeholder: 'Nhập và chọn tên doanh nghiệp (VI)',
            setting: { querySelect: { queryFn: BusinessService.searchBusinessesByVIName } },
            className: 'md:col-span-2'
          },
          {
            type: 'input',
            name: 'dossierCode',
            placeholder: 'Nhập mã hồ sơ'
          },
          {
            type: 'input',
            name: 'licenseCode',
            placeholder: 'Nhập mã giấy phép'
          },

          {
            type: 'select',
            name: 'licenseType',
            placeholder: 'Chọn loại giấy phép',
            setting: {
              select: {
                groups: [
                  {
                    label: 'Loại giấy phép',
                    options: LICENSE_TYPE_OPTIONS
                  }
                ]
              }
            }
          },
          {
            type: 'select',
            name: 'licenseStatus',
            placeholder: 'Chọn trạng thái giấy phép',
            setting: {
              select: {
                groups: [
                  {
                    label: 'Trạng thái giấy phép',
                    options: LICENSE_STATUS_OPTIONS
                  }
                ]
              }
            }
          },
          {
            type: 'input',
            name: 'effectiveDateFrom',
            description: 'Từ ngày (hiệu lực)',
            setting: { input: { type: 'date' } }
          },
          {
            type: 'input',
            name: 'effectiveDateTo',
            description: 'Đến ngày (hiệu lực)',
            setting: { input: { type: 'date' } }
          },
          {
            type: 'input',
            name: 'expirationDateFrom',
            description: 'Từ ngày (hết hạn)',
            setting: { input: { type: 'date' } }
          },
          {
            type: 'input',
            name: 'expirationDateTo',
            description: 'Đến ngày (hết hạn)',
            setting: { input: { type: 'date' } }
          }
        ]}
      />

      <CustomTable
        data={querySearchLicenses.data?.data || []}
        items={[
          {
            header: 'Mã giấy phép',
            value: 'licenseCode',
            className: 'min-w-[150px] font-semibold text-blue-500 hover:underline'
          },
          {
            header: 'Mã hồ sơ',
            value: 'dossierCode',
            className: 'min-w-[150px] font-semibold text-blue-500 hover:underline'
          },
          { header: 'Loại giấy phép', value: 'licenseType' },
          {
            header: 'Trạng thái giấy phép',
            value: 'licenseStatus',
            render: (item) => <Badge>{item.licenseStatus}</Badge>
          },
          {
            header: 'Ngày hiệu lực',
            value: 'effectiveDate'
          },
          {
            header: 'Ngày hết hạn',
            value: 'expirationDate'
          },
          {
            header: 'Tệp giấy phép',
            value: 'filePath',
            render: (item) => (
              <Badge variant={item.filePath ? 'default' : 'destructive'}>{item.filePath ? 'Đã có' : 'Chưa có'}</Badge>
            )
          },
          {
            header: 'Hành động',
            value: 'action',
            render: (item) => (
              <ButtonGroup>
                <Button size='icon' variant='outline' onClick={() => setIdDetail(item.id)} title='Chỉnh sửa giấy phép'>
                  <PencilIcon />
                </Button>
                <DeleteAlertDialog
                  title='Xóa giấy phép'
                  onDelete={() => mutateDeleteLicense.trigger(item.id)}
                  description={
                    <span>
                      Giấy phép <b>{item.licenseCode}</b> sẽ bị xóa khỏi hệ thống, thao tác này không thể hoàn tác.
                    </span>
                  }
                >
                  <Button variant='destructive' size='icon' title='Xóa hồ sơ'>
                    <TrashIcon />
                  </Button>
                </DeleteAlertDialog>
              </ButtonGroup>
            )
          }
        ]}
      />
      <CustomPagination
        page={querySearchLicenses.data?.page}
        totalPage={querySearchLicenses.data?.totalPage || 1}
        onChangePage={handleChangePage}
      />

      <InfoLicenseDialog
        idDetail={idDetail}
        onClose={() => setIdDetail(undefined)}
        data={queryLicenseDetail.data}
        refetch={querySearchLicenses.mutate}
      />
    </div>
  )
}

export default LicenseManagementPage
