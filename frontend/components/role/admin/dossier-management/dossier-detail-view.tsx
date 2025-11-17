'use client'

import PageHeader from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import {
  BriefcaseBusiness,
  CalendarArrowDown,
  CalendarArrowUp,
  CalendarPlus,
  ChartArea,
  Code,
  EditIcon,
  RefreshCcw,
  TrashIcon,
  Type
} from 'lucide-react'
import DeleteAlertDialog from '../common/delete-alert-dialog'
import useSWR from 'swr'
import DossierService from '@/services/go/dossier.service'
import useSWRMutation from 'swr/mutation'
import { showNotification } from '@/lib/utils/common'
import { useRouter } from 'next/navigation'
import DescriptionView from '@/components/common/description-view'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import DocumentItem from './document-item'
import { useState } from 'react'
import InfoDossierDialog from './info-dossier-dialog'
import { DOSSIER_STATUS_OPTIONS } from '@/constants/dossier'
import { Separator } from '@/components/ui/separator'

interface Props {
  id: string
}

const DossierDetailView: React.FC<Props> = (props) => {
  const router = useRouter()
  const [openInfoDossierDialog, setOpenInfoDossierDialog] = useState(false)

  const queryDossierDetail = useSWR(props.id, () => DossierService.getDossierById(props.id))

  const mutateDeleteDossier = useSWRMutation('dossier-delete', () => DossierService.deleteDossier(props.id), {
    onSuccess: () => {
      showNotification('success', 'Xóa hồ sơ thành công')
      router.push('/admin/dossier-management')
    },
    onError: (error) => {
      showNotification('error', error.message || 'Xóa hồ sơ thất bại')
    }
  })

  return (
    <div className='space-y-2 md:space-y-4'>
      <PageHeader
        title='Chi tiết hồ sơ'
        hasBackButton
        actions={[
          <Button key='reload' variant='outline' onClick={() => queryDossierDetail.mutate()}>
            <RefreshCcw />
            <span className='hidden md:block'>Tải lại</span>
          </Button>,
          <DeleteAlertDialog
            key='delete'
            description={
              <span>
                Hồ sơ <b>{queryDossierDetail.data?.dossierCode}</b> sẽ bị xóa khỏi hệ thống, thao tác này không thể hoàn
                tác.
              </span>
            }
            onDelete={mutateDeleteDossier.trigger}
            title='Xóa hồ sơ'
          >
            <Button variant={'destructive'}>
              <TrashIcon />
              <span className='hidden md:block'>Xóa hồ sơ</span>
            </Button>
          </DeleteAlertDialog>
        ]}
      />

      <DescriptionView
        title='Thông tin hồ sơ'
        loading={queryDossierDetail.isLoading}
        errorText={queryDossierDetail.error?.message}
        actions={[
          <Button
            variant='outline'
            key='edit'
            onClick={() => setOpenInfoDossierDialog(true)}
            title='Chỉnh sửa thông tin hồ sơ'
          >
            <EditIcon />
            <span className='hidden md:block'>Chỉnh sửa</span>
          </Button>
        ]}
        items={[
          { icon: <Code />, title: 'Mã hồ sơ', value: queryDossierDetail.data?.dossierCode },
          {
            icon: <BriefcaseBusiness />,
            title: 'Doanh nghiệp',
            value: (
              <Link
                href={`/admin/business-management/${queryDossierDetail.data?.businessId}`}
                className='font-semibold text-blue-500 hover:underline'
              >
                {queryDossierDetail.data?.businessName}
              </Link>
            )
          },
          {
            icon: <Type />,
            title: 'Loại thủ tục',
            value: queryDossierDetail.data?.dossierType
          },
          {
            icon: <ChartArea />,
            title: 'Trạng thái',
            value: (
              <Badge variant={queryDossierDetail.data?.dossierStatus === 'MoiTao' ? 'outline' : 'default'}>
                {
                  DOSSIER_STATUS_OPTIONS.find((option) => option.value === queryDossierDetail.data?.dossierStatus)
                    ?.label
                }
              </Badge>
            )
          },
          {
            icon: <CalendarPlus />,
            title: 'Ngày đăng ký',
            value: queryDossierDetail.data?.issuedDate
          },
          {
            icon: <CalendarArrowDown />,
            title: 'Ngày tiếp nhận',
            value: queryDossierDetail.data?.receivedDate
          },
          {
            icon: <CalendarArrowUp />,
            title: 'Ngày hẹn trả',
            value: queryDossierDetail.data?.expectedReturnDate
          }
        ]}
      />
      <Separator className='my-2 md:my-4' />
      {queryDossierDetail.data && (
        <InfoDossierDialog
          idDetail={openInfoDossierDialog ? props.id : undefined}
          onClose={() => setOpenInfoDossierDialog(false)}
          data={queryDossierDetail.data}
          refetch={queryDossierDetail.mutate}
          businessId={queryDossierDetail.data.businessId}
          businessName={queryDossierDetail.data.businessName}
        />
      )}
      <PageHeader title='Danh sách tài liệu hồ sơ' />
      <div className='space-y-2 md:space-y-4'>
        {queryDossierDetail.data?.documents.map((document) => (
          <DocumentItem
            key={document.id}
            dossierDocument={document}
            refetch={queryDossierDetail.mutate}
            isOnDetailPage
          />
        ))}
      </div>
    </div>
  )
}

export default DossierDetailView
