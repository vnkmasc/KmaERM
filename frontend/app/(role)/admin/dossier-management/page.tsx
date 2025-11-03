'use client'

import PageHeader from '@/components/common/page-header'
import CustomPagination from '@/components/role/admin/common/custom-pagination'
import CustomTable from '@/components/role/admin/common/custom-table'
import Filter from '@/components/role/admin/common/filter'
import { Badge } from '@/components/ui/badge'
import { getInitialSearchParamsToObject } from '@/lib/utils/common'
import DossierService from '@/services/go/dossier.service'
import { IDossierSearchParams } from '@/types/dossier'
import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'

const DossierManagementPage = () => {
  const parseSearchParamsToObject = getInitialSearchParamsToObject()
  const defaultFilter = {
    ...parseSearchParamsToObject,
    page: Number(parseSearchParamsToObject.page) || 1
  }
  const [filter, setFilter] = useState<IDossierSearchParams>(defaultFilter)

  const querySearchDossiers = useSWR('dossier' + JSON.stringify(filter), () =>
    DossierService.searchDossiers({
      doanh_nghiep_id: filter.businessId,
      // dossierStatus: filter.dossierStatus,
      // dossierCode: filter.dossierCode,
      // dateType: filter.dateType,
      // from: filter.from,
      // to: filter.to,
      page: filter.page
    })
  )

  const handleChangePage = (page: number) => {
    setFilter({ ...filter, page })
  }

  return (
    <div className='space-y-2 md:space-y-4'>
      <PageHeader title='Quản lý hồ sơ' />
      <Filter
        items={[{ type: 'input', name: 'businessId', placeholder: 'Nhập id doanh nghiệp' }]}
        onFilter={setFilter}
        refetch={querySearchDossiers.mutate}
        defaultValues={defaultFilter}
      />

      <CustomTable
        data={querySearchDossiers.data?.data || []}
        items={[
          { header: 'Mã hồ sơ', value: 'dossierCode', className: 'min-w-[150px] font-semibold text-main' },
          {
            header: 'Tên doanh nghiệp (VI)',
            value: 'viBusinessName',
            className: 'min-w-[200px] font-semibold text-blue-500',
            render: (item) => <Link href={`/admin/business-management/${item.businessId}`}>{item.viBusinessName}</Link>
          },
          {
            header: 'Loại thủ tục',
            value: 'dossierType'
          },
          {
            header: 'Trạng thái',
            value: 'dossierStatus',
            render: (item) => <Badge>{item.dossierStatus}</Badge>
          },
          { header: 'Ngày đăng ký', value: 'issuedDate' },
          { header: 'Ngày tiếp nhận', value: 'receivedDate' },
          { header: 'Ngày hẹn trả', value: 'expectedReturnDate' }
        ]}
        pageSize={querySearchDossiers.data?.limit}
        page={querySearchDossiers.data?.page}
      />
      <CustomPagination
        page={querySearchDossiers.data?.page}
        totalPage={querySearchDossiers.data?.total}
        onChangePage={handleChangePage}
      />
    </div>
  )
}

export default DossierManagementPage
