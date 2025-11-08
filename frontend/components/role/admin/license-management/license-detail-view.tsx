'use client'

import PageHeader from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { showNotification } from '@/lib/utils/common'
import LicenseService from '@/services/go/license.service'
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarX2,
  ChartArea,
  Code,
  DownloadIcon,
  Edit,
  FileIcon,
  FileText,
  RefreshCcw,
  TrashIcon,
  Type
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import DeleteAlertDialog from '../common/delete-alert-dialog'
import DescriptionView from '@/components/common/description-view'
import Link from 'next/link'
import { LICENSE_STATUS_OPTIONS } from '@/constants/license'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import UploadLicense from './upload-license'
import UploadBlockchainButton from './upload-blockchain-button'
import InfoLicenseDialog from './info-license-dialog'
import { useState } from 'react'
import DossierService from '@/services/go/dossier.service'

interface Props {
  id: string
}

const LicenseDetailView: React.FC<Props> = (props) => {
  const router = useRouter()
  const [openInfoLicenseDialog, setOpenInfoLicenseDialog] = useState(false)
  const queryLicenseDetail = useSWR(props.id, () => LicenseService.getLicenseByIdWithBusiness(props.id))

  const queryAllDossiersOfBusiness = useSWR(queryLicenseDetail.data?.businessId, () =>
    DossierService.getAllDossiersOfBusiness(queryLicenseDetail.data?.businessId as string)
  )

  const mutateDeleteLicense = useSWRMutation('license-delete', () => LicenseService.deleteLicense(props.id), {
    onSuccess: () => {
      showNotification('success', 'Xóa giấy phép thành công')
      router.push('/admin/license-management')
    },
    onError: (error) => {
      showNotification('error', error.message || 'Xóa giấy phép thất bại')
    }
  })

  const mutateActionLicenseFile = useSWRMutation(
    'license-file-view',
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
      const res = await LicenseService.getLicenseFile(props.id)
      const iframUrl = URL.createObjectURL(res)

      setTimeout(() => {
        URL.revokeObjectURL(iframUrl)
      }, 5000)

      switch (arg.mode) {
        case 'download':
          const link = document.createElement('a')
          link.href = iframUrl
          link.download = arg.fileName || 'giay-phep.pdf'
          link.click()
          break
        case 'new-tab':
          window.open(iframUrl, '_blank')
          break
        default:
          return iframUrl
      }
    }
  )

  const queryLicenseFile = useSWR(
    'license-file-' + props.id,
    async () => {
      const res = await LicenseService.getLicenseFile(props.id)
      const iframUrl = URL.createObjectURL(res)

      return iframUrl
    },
    {
      revalidateOnFocus: false
    }
  )

  const refetchAll = () => {
    queryLicenseDetail.mutate()
    queryLicenseFile.mutate()
  }

  return (
    <div className='space-y-2 md:space-y-4'>
      <PageHeader
        title='Chi tiết thông tin giấy phép'
        hasBackButton
        actions={[
          <UploadBlockchainButton
            key='upload-blockchain-license'
            licenseId={props.id}
            refetch={refetchAll}
            hasFile={!!queryLicenseDetail.data?.filePath}
          />,
          <Button key='reload' variant='outline' onClick={refetchAll}>
            <RefreshCcw />
            <span className='hidden md:block'>Tải lại</span>
          </Button>,
          <DeleteAlertDialog
            key='delete'
            title='Xóa giấy phép'
            onDelete={() => mutateDeleteLicense.trigger()}
            description={
              <span>
                Giấy phép <b>{queryLicenseDetail.data?.licenseCode}</b> sẽ bị xóa khỏi hệ thống, thao tác này không thể
                hoàn tác.
              </span>
            }
          >
            <Button variant='destructive' title='Xóa hồ sơ'>
              <TrashIcon />
              <span className='hidden md:block'>Xóa giấy phép</span>
            </Button>
          </DeleteAlertDialog>
        ]}
      />
      <DescriptionView
        title='Thông tin giấy phép'
        loading={queryLicenseDetail.isLoading}
        errorText={queryLicenseDetail.error?.message}
        actions={[
          <Button variant='outline' key='update' onClick={() => setOpenInfoLicenseDialog(true)}>
            <Edit /> <span className='hidden md:block'>Chỉnh sửa</span>
          </Button>
        ]}
        items={[
          { icon: <Code />, title: 'Mã giấy phép', value: queryLicenseDetail.data?.licenseCode },
          {
            icon: <BriefcaseBusiness />,
            title: 'Doanh nghiệp',
            value: (
              <Link
                href={`/admin/business-management/${queryLicenseDetail.data?.businessId}`}
                className='font-semibold text-blue-500 hover:underline'
              >
                {queryLicenseDetail.data?.businessName}
              </Link>
            )
          },
          {
            icon: <FileText />,
            title: 'Mã hồ sơ',
            value: (
              <Link
                href={`/admin/dossier-management/${queryLicenseDetail.data?.dossierId}`}
                className='font-semibold text-blue-500 hover:underline'
              >
                {queryLicenseDetail.data?.dossierCode}
              </Link>
            )
          },

          { icon: <Type />, title: 'Loại giấy phép', value: queryLicenseDetail.data?.licenseType },
          {
            icon: <ChartArea />,
            title: 'Trạng thái',
            value: (
              <Badge>
                {
                  LICENSE_STATUS_OPTIONS.find((option) => option.value === queryLicenseDetail.data?.licenseStatus)
                    ?.label
                }
              </Badge>
            )
          },
          { icon: <CalendarCheck />, title: 'Ngày hiệu lực', value: queryLicenseDetail.data?.effectiveDate },
          { icon: <CalendarX2 />, title: 'Ngày hết hạn', value: queryLicenseDetail.data?.expirationDate }
        ]}
      />
      <Separator className='my-2 md:my-4' />

      {mutateActionLicenseFile.isMutating ? (
        <Skeleton className='h-[300px] w-full md:h-[500px]' />
      ) : mutateActionLicenseFile.error ? (
        <Alert variant='destructive' className='mx-auto max-w-[700px]'>
          <AlertCircle />
          <AlertTitle>Đã có lỗi khi tải giấy phép</AlertTitle>
          <AlertDescription>{mutateActionLicenseFile.error.message}</AlertDescription>
        </Alert>
      ) : (
        <>
          <PageHeader
            title='Tệp giấy phép'
            actions={[
              <UploadLicense key='upload-license' licenseId={props.id} refetch={queryLicenseFile.mutate} />,
              <Button
                key='download'
                onClick={() =>
                  mutateActionLicenseFile.trigger({
                    mode: 'download',
                    fileName: queryLicenseDetail.data?.licenseCode + '- GP.pdf'
                  })
                }
              >
                <DownloadIcon />
                <span className='hidden md:block'>Tải xuống</span>
              </Button>,
              <Button
                key='view-in-new-tab'
                variant='outline'
                onClick={() => mutateActionLicenseFile.trigger({ mode: 'new-tab' })}
              >
                <FileIcon />
                <span className='hidden md:block'>Xem tệp</span>
              </Button>
            ]}
          />
          <iframe src={queryLicenseFile.data} className='h-[500px] w-full md:h-[700px]' />
        </>
      )}

      {queryLicenseDetail.data && (
        <InfoLicenseDialog
          data={queryLicenseDetail.data}
          idDetail={openInfoLicenseDialog ? props.id : undefined}
          onClose={() => setOpenInfoLicenseDialog(false)}
          refetch={queryLicenseDetail.mutate}
          dossierCodes={queryAllDossiersOfBusiness.data ?? []}
        />
      )}
    </div>
  )
}

export default LicenseDetailView
