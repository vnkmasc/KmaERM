'use client'

import PageHeader from '@/components/common/page-header'
import CustomPagination from '@/components/role/admin/common/custom-pagination'
import CustomTable from '@/components/role/admin/common/custom-table'
import DeleteAlertDialog from '@/components/role/admin/common/delete-alert-dialog'
import Filter from '@/components/role/admin/common/filter'
import DocumentItem from '@/components/role/admin/dossier-management/document-item'
import InfoDossierDialog from '@/components/role/admin/dossier-management/info-dossier-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Dialog, DialogTitle, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { DATE_TYPE_OPTIONS, DOSSIER_STATUS_OPTIONS } from '@/constants/dossier'
import { parseDateInputToISO, searchParamsToObject, showNotification } from '@/lib/utils/common'
import BusinessService from '@/services/go/business.service'
import DossierService from '@/services/go/dossier.service'
import { IDossierSearchParams } from '@/types/dossier'
import { FileIcon, LinkIcon, PencilIcon, PlusIcon, TrashIcon } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'

const DossierManagementPage = () => {
  // Sử dụng search params khiến cho default value của select không bị lỗi
  const searchParams = useSearchParams()
  const initialParams = useMemo(() => searchParamsToObject(searchParams), [searchParams])
  const defaultFilter = {
    ...initialParams,
    page: Number(initialParams.page) || 1
  }
  const [filter, setFilter] = useState<IDossierSearchParams>(defaultFilter)
  const [idDetail, setIdDetail] = useState<string | undefined | null>(undefined)
  const [idDetailForUploadDocument, setIdDetailForUploadDocument] = useState<string | undefined>(undefined)

  const renderRangeDate = (dateType: string | undefined, from: string | undefined, to: string | undefined) => {
    if (!dateType) return {}

    const formatFromDate = parseDateInputToISO(from)
    const formatToDate = parseDateInputToISO(to)

    switch (dateType) {
      case 'issuedDate':
        return {
          ngay_dang_ky_from: formatFromDate,
          ngay_dang_ky_to: formatToDate
        }
      case 'receivedDate':
        return {
          ngay_tiep_nhan_from: formatFromDate,
          ngay_tiep_nhan_to: formatToDate
        }
      case 'expectedReturnDate':
        return {
          ngay_hen_tra_from: formatFromDate,
          ngay_hen_tra_to: formatToDate
        }
    }
    return {}
  }

  const querySearchDossiers = useSWR(filter.businessId ? 'dossier' + JSON.stringify(filter) : undefined, () =>
    DossierService.searchDossiers({
      doanh_nghiep_id: filter.businessId,
      trang_thai_ho_so: filter.dossierStatus,
      ma_ho_so: filter.dossierCode,
      ...renderRangeDate(filter.dateType, filter.from, filter.to),
      page: filter.page
    })
  )

  const queryDossierDetail = useSWR(idDetail || idDetailForUploadDocument, () =>
    DossierService.getDossierById(idDetail || (idDetailForUploadDocument as string))
  )

  const mutateDeleteDossier = useSWRMutation(
    'dossier-delete',
    (_, { arg }: { arg: string }) => DossierService.deleteDossier(arg),
    {
      onSuccess: () => {
        showNotification('success', 'Xóa hồ sơ thành công')
        querySearchDossiers.mutate()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Xóa hồ sơ thất bại')
      }
    }
  )

  const handleChangePage = (page: number) => {
    setFilter({ ...filter, page })
  }

  useEffect(() => {
    if (!filter.businessId) {
      showNotification('info', 'Vui lòng chọn doanh nghiệp để tìm kiếm hồ sơ')
    } else if ((filter.from || filter.to) && !filter.dateType) {
      showNotification('info', 'Vui lòng chọn loại ngày để tìm kiếm theo khoảng ngày')
    }
  }, [filter])

  return (
    <div className='space-y-2 md:space-y-4'>
      <PageHeader
        title='Quản lý hồ sơ'
        actions={[
          <Button
            key='add-dossier'
            onClick={() => {
              if (!filter.businessId) {
                showNotification('warning', 'Vui lòng chọn doanh nghiệp ở phần tìm kiếm để tạo hồ sơ')
                return
              }
              setIdDetail(null)
            }}
          >
            <PlusIcon /> <span className='hidden md:block'>Tạo mới</span>
          </Button>
        ]}
      />
      <Filter
        items={[
          {
            type: 'query_select',
            name: 'businessId',
            placeholder: 'Nhập và chọn tên doanh nghiệp (VI)',
            setting: { querySelect: { queryFn: BusinessService.searchBusinessesByVIName } },
            className: 'md:col-span-2'
          },
          {
            type: 'select',
            name: 'dossierStatus',
            placeholder: 'Chọn trạng thái hồ sơ',
            setting: {
              select: {
                groups: [
                  {
                    label: 'Trạng thái',
                    options: DOSSIER_STATUS_OPTIONS
                  }
                ]
              }
            }
          },
          {
            type: 'input',
            name: 'dossierCode',
            placeholder: 'Nhập mã hồ sơ'
          },
          {
            type: 'select',
            name: 'dateType',
            placeholder: 'Chọn loại ngày',
            setting: {
              select: {
                groups: [
                  {
                    label: 'Loại ngày',
                    options: DATE_TYPE_OPTIONS
                  }
                ]
              }
            }
          },
          {
            type: 'input',
            name: 'from',
            setting: { input: { type: 'date' } },
            description: 'Từ ngày'
          },
          {
            type: 'input',
            name: 'to',
            setting: { input: { type: 'date' } },
            description: 'Đến ngày'
          }
        ]}
        onFilter={setFilter}
        refetch={querySearchDossiers.mutate}
        defaultValues={defaultFilter}
        description='Chọn doanh nghiệp để tìm kiếm hồ sơ, chọn loại ngày để tìm kiếm theo khoảng ngày'
      />

      <CustomTable
        data={querySearchDossiers.data?.data || []}
        items={[
          {
            header: 'Mã hồ sơ',
            value: 'dossierCode',
            className: 'min-w-[150px] font-semibold text-blue-500 hover:underline',
            render: (item) => <Link href={`/admin/dossier-management/${item.id}`}>{item.dossierCode}</Link>
          },
          {
            header: 'Loại thủ tục',
            value: 'dossierType'
          },
          {
            header: 'Trạng thái',
            value: 'dossierStatus',
            render: (item) => (
              <Badge variant={item.dossierStatus === 'MoiTao' ? 'outline' : 'default'}>{item.dossierStatus}</Badge>
            )
          },
          { header: 'Ngày đăng ký', value: 'issuedDate' },
          { header: 'Ngày tiếp nhận', value: 'receivedDate' },
          { header: 'Ngày hẹn trả', value: 'expectedReturnDate' },
          {
            header: 'Hành động',
            value: 'action',
            render: (item) => (
              <ButtonGroup>
                <Link href={`/admin/business-management/${filter.businessId}`}>
                  <Button
                    size={'icon'}
                    title='Xem chi tiết toàn bộ thông tin doanh nghiệp'
                    className='rounded-r-none!'
                    variant={'secondary'}
                  >
                    <LinkIcon />
                  </Button>
                </Link>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setIdDetail(item.id)}
                  title='Chỉnh sửa thông tin hồ sơ'
                >
                  <PencilIcon />
                </Button>
                <Button
                  size='icon'
                  title='Xem danh sách tài liệu hồ sơ'
                  onClick={() => setIdDetailForUploadDocument(item.id)}
                >
                  <FileIcon />
                </Button>
                <DeleteAlertDialog
                  description={
                    <span>
                      Hồ sơ <b>{item.dossierCode}</b> sẽ bị xóa khỏi hệ thống, thao tác này không thể hoàn tác.
                    </span>
                  }
                  onDelete={() => mutateDeleteDossier.trigger(item.id)}
                  title='Xóa hồ sơ'
                >
                  <Button variant='destructive' size='icon' title='Xóa hồ sơ'>
                    <TrashIcon />
                  </Button>
                </DeleteAlertDialog>
              </ButtonGroup>
            )
          }
        ]}
        pageSize={querySearchDossiers.data?.limit}
        page={querySearchDossiers.data?.page}
      />
      <CustomPagination
        page={querySearchDossiers.data?.page}
        totalPage={querySearchDossiers.data?.totalPage || 1}
        onChangePage={handleChangePage}
      />
      <InfoDossierDialog
        idDetail={idDetail}
        onClose={() => setIdDetail(undefined)}
        data={queryDossierDetail.data}
        refetch={querySearchDossiers.mutate}
        businessId={filter.businessId!}
      />

      <Dialog
        open={idDetailForUploadDocument !== undefined}
        onOpenChange={() => setIdDetailForUploadDocument(undefined)}
      >
        <DialogContent className='max-h-[60vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Thêm tài liệu vào hồ sơ</DialogTitle>
          </DialogHeader>

          <div className='flex gap-2'>
            <Label>Mã hồ sơ:</Label>
            <span className='text-muted-foreground'>{queryDossierDetail.data?.dossierCode}</span>
          </div>

          <div className='space-y-2 md:space-y-4'>
            {queryDossierDetail.data?.documents.map((document) => (
              <DocumentItem key={document.id} dossierDocument={document} refetch={queryDossierDetail.mutate} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DossierManagementPage
