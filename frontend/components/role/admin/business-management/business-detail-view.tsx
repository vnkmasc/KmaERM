'use client'

import PageHeader from '@/components/common/page-header'
import DescriptionView from '@/components/common/description-view'
import {
  ALargeSmall,
  Bold,
  Calendar,
  CaseSensitive,
  Code,
  DollarSign,
  DownloadIcon,
  Edit,
  FileIcon,
  Globe,
  Mail,
  Map,
  MapPinHouse,
  Phone,
  RefreshCcw,
  RepeatIcon,
  TrashIcon,
  Type,
  UserRoundPen,
  UserStar
} from 'lucide-react'
import useSWR, { mutate } from 'swr'
import BusinessService from '@/services/go/business.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import UploadBusinessCertificate from './upload-business-certificate'
import useSWRMutation from 'swr/mutation'
import { useState } from 'react'
import InfoBusinessDialog from './info-business-dialog'
import UpdateBusinessCodeDialog from './update-business-code-dialog'
import { parseDateISOForInput, showNotification } from '@/lib/utils/common'
import { useRouter } from 'next/navigation'
import DeleteAlertDialog from '../common/delete-alert-dialog'
import { Separator } from '@/components/ui/separator'
import PdfView from '../common/pdf-view'

interface Props {
  id: string
}

const BusinessDetailView: React.FC<Props> = (props) => {
  const queryBusinessDetail = useSWR(props.id, () => BusinessService.getBusinessById(props.id))
  const [openInfoBusinessDialog, setOpenInfoBusinessDialog] = useState(false)
  const [openUpdateBusinessCodeDialog, setOpenUpdateBusinessCodeDialog] = useState(false)
  const router = useRouter()

  const mutateActionCertificate = useSWRMutation(
    'business-certificate-view',
    async (
      _,
      {
        arg
      }: {
        arg: {
          mode: 'download' | 'new-tab'
          fileName?: string
        }
      }
    ) => {
      const res = await BusinessService.getRegistrationCertificate(props.id)
      const iframUrl = URL.createObjectURL(res)

      setTimeout(() => {
        URL.revokeObjectURL(iframUrl)
      }, 5000)

      switch (arg.mode) {
        case 'download':
          const link = document.createElement('a')
          link.href = iframUrl
          link.download = arg.fileName || 'giay-chung-nhan-dang-ky-kinh-doanh.pdf'
          link.click()
          break
        case 'new-tab':
          window.open(iframUrl, '_blank')
          break
      }
    },
    {
      onError: (error) => {
        showNotification('error', error.message || 'Thao tác với giấy chứng nhận thất bại')
      }
    }
  )

  const mutateDeleteBusiness = useSWRMutation('business-delete', () => BusinessService.deleteBusiness(props.id), {
    onSuccess: () => {
      router.push('/admin/business-management')
      showNotification('success', 'Xóa doanh nghiệp thành công')
    },
    onError: (error) => {
      showNotification('error', error.message || 'Xóa doanh nghiệp thất bại')
    }
  })

  const refetchAll = () => {
    queryBusinessDetail.mutate()
    mutate('pdf-view-' + props.id)
  }

  return (
    <div className='space-y-2 md:space-y-4'>
      <PageHeader
        title='Chi tiết thông tin doanh nghiệp'
        hasBackButton
        actions={[
          <Button key='reload' variant='outline' onClick={refetchAll}>
            <RefreshCcw />
            <span className='hidden md:block'>Tải lại</span>
          </Button>,
          <DeleteAlertDialog
            key='delete'
            description={
              <span>
                Doanh nghiệp <b>{queryBusinessDetail.data?.viName}</b> sẽ bị xóa khỏi hệ thống, thao tác này không thể
                hoàn tác.
              </span>
            }
            onDelete={mutateDeleteBusiness.trigger}
            title='Xóa doanh nghiệp'
          >
            <Button variant={'destructive'}>
              <TrashIcon />
              <span className='hidden md:block'>Xóa DN</span>
            </Button>
          </DeleteAlertDialog>
        ]}
      />
      <DescriptionView
        loading={queryBusinessDetail.isLoading}
        errorText={queryBusinessDetail.error?.message}
        actions={[
          <Button variant='outline' key='update' onClick={() => setOpenInfoBusinessDialog(true)}>
            <Edit /> <span className='hidden md:block'>Chỉnh sửa</span>
          </Button>,
          <Button
            key='change-business-code'
            title='Chỉnh sửa mã số doanh nghiệp'
            onClick={() => setOpenUpdateBusinessCodeDialog(true)}
          >
            <UserRoundPen /> <span className='hidden md:block'>Chỉnh sửa MSDN</span>
          </Button>
        ]}
        title={'Thông tin doanh nghiệp'}
        items={[
          { icon: <Code />, title: 'Mã doanh nghiệp', value: queryBusinessDetail.data?.businessCode },
          { icon: <CaseSensitive />, title: 'Tên doanh nghiệp (VI)', value: queryBusinessDetail.data?.viName },
          { icon: <ALargeSmall />, title: 'Tên doanh nghiệp (EN)', value: queryBusinessDetail.data?.enName },
          { icon: <Bold />, title: 'Tên viết tắt', value: queryBusinessDetail.data?.shortName },
          { icon: <MapPinHouse />, title: 'Địa chỉ', value: queryBusinessDetail.data?.address },
          { icon: <Map />, title: 'Nơi cấp MSDN', value: queryBusinessDetail.data?.issuedBy },
          {
            icon: <Calendar />,
            title: 'Ngày cấp lần đầu MSDN',
            value: queryBusinessDetail.data?.firstIssuedDate
          },
          {
            icon: <RepeatIcon />,
            title: 'Số lần thay đổi MSDN',
            value: queryBusinessDetail.data?.businessCodeChangeCount ? (
              queryBusinessDetail.data?.businessCodeChangeCount +
              ' lần với ngày gần nhất ' +
              parseDateISOForInput(queryBusinessDetail.data?.businessCodeChangeDate || '')
            ) : (
              <span className='italic'>Chưa thay đổi</span>
            )
          },
          {
            icon: <UserStar />,
            title: 'Người đại diện pháp luật',
            value: (
              <div className='flex items-center gap-2'>
                {queryBusinessDetail.data?.legalRepresentative} <Badge>{queryBusinessDetail.data?.position}</Badge>
              </div>
            )
          },
          { icon: <Type />, title: 'Loại giấy tờ định danh', value: queryBusinessDetail.data?.idType },
          {
            icon: <Calendar />,
            title: 'Ngày cấp định danh',
            value: queryBusinessDetail.data?.idIssuedDate
          },
          { icon: <Map />, title: 'Nơi cấp định danh', value: queryBusinessDetail.data?.issuedBy },
          { icon: <DollarSign />, title: 'Vốn điều lệ', value: queryBusinessDetail.data?.charterCapital + ' VND' },
          { icon: <Mail />, title: 'Email', value: queryBusinessDetail.data?.email },
          { icon: <Globe />, title: 'Website', value: queryBusinessDetail.data?.website },
          { icon: <Phone />, title: 'Số điện thoại', value: queryBusinessDetail.data?.phoneNumber }
        ]}
      />

      <Separator className='my-2 md:my-4' />

      <PageHeader
        title='Giấy chứng nhận đăng ký kinh doanh'
        actions={[
          <UploadBusinessCertificate
            key={'upload-business-certificate'}
            businessId={props.id}
            refetch={() => mutate('pdf-view-' + props.id)}
          />,
          <Button
            key='download'
            onClick={() => {
              if (!queryBusinessDetail.data?.certificateFilePath) {
                showNotification('warning', 'Doanh nghiệp chưa có giấy chứng nhận')
                return
              }

              mutateActionCertificate.trigger({
                mode: 'download',
                fileName: queryBusinessDetail.data?.viName + ' - GCNDKDN.pdf'
              })
            }}
          >
            <DownloadIcon /> <span className='hidden md:block'>Tải xuống</span>
          </Button>,
          <Button
            key='view-in-new-tab'
            variant={'outline'}
            onClick={() => {
              if (!queryBusinessDetail.data?.certificateFilePath) {
                showNotification('warning', 'Doanh nghiệp chưa có giấy chứng nhận')
                return
              }

              mutateActionCertificate.trigger({ mode: 'new-tab' })
            }}
            title='Xem giấy chứng nhận trong tab mới'
          >
            <FileIcon /> <span className='hidden md:block'>Xem tệp</span>
          </Button>
        ]}
      />

      <PdfView queryFn={() => BusinessService.getRegistrationCertificate(props.id)} idKey={props.id} />

      {queryBusinessDetail.data && (
        <>
          <InfoBusinessDialog
            idDetail={openInfoBusinessDialog ? props.id : undefined}
            onClose={() => setOpenInfoBusinessDialog(false)}
            data={queryBusinessDetail.data}
            refetch={queryBusinessDetail.mutate}
          />
          <UpdateBusinessCodeDialog
            refetch={queryBusinessDetail.mutate}
            updateBusinessSetup={
              openUpdateBusinessCodeDialog
                ? { businessCode: queryBusinessDetail.data?.businessCode, id: props.id }
                : undefined
            }
            onClose={() => setOpenUpdateBusinessCodeDialog(false)}
          />
        </>
      )}
    </div>
  )
}

export default BusinessDetailView
