'use client'

import CustomTable from '@/components/common/custom-table'
import PageHeader from '@/components/common/page-header'
import Filter from '@/components/role/admin/common/filter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitialSearchParamsToObject } from '@/lib/utils/common'
import BusinessService from '@/services/go/business.service'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

const BusinessManagementPage = () => {
  const defaultFilter = getInitialSearchParamsToObject()
  const [filter, setFilter] = useState<any>(defaultFilter)

  const querySearchBusinesses = useSWR('business' + JSON.stringify(filter), () =>
    BusinessService.searchBusinesses({
      viet_tat: filter.abbreviation,
      ten_vi: filter.viName,
      ten_en: filter.enName,
      ma_so: filter.businessCode,
      page: Number(filter.page) || 1
    })
  )

  return (
    <div>
      <PageHeader
        title='Quản lý doanh nghiệp'
        actions={[
          <Button key='add-business'>
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
          }
        ]}
      />
    </div>
  )
}

export default BusinessManagementPage
