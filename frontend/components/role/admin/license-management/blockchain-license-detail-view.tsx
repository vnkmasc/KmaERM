'use client'

import DescriptionView from '@/components/common/description-view'
import PageHeader from '@/components/common/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { BLOCKCHAIN_STATUS_OPTIONS, LICENSE_STATUS_OPTIONS } from '@/constants/license'
import LicenseService from '@/services/go/license.service'
import {
  AlertCircleIcon,
  Blocks,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarX2,
  ChartArea,
  CheckCircleIcon,
  FileText,
  RefreshCcw,
  Type
} from 'lucide-react'
import { Code } from 'lucide-react'
import useSWR from 'swr'
import PdfView from '../common/pdf-view'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  id: string
}

const BlockchainLicenseDetailView: React.FC<Props> = (props) => {
  const queryBlockchainLicenseVerify = useSWR('blockchain' + props.id, () =>
    LicenseService.verifyBlockchainLicense(props.id)
  )

  return (
    <div className='space-y-2 md:space-y-4'>
      <PageHeader
        title='Chi tiết giấy phép blockchain'
        hasBackButton
        actions={[
          <Button key='reload' variant='outline' onClick={() => queryBlockchainLicenseVerify.mutate()}>
            <RefreshCcw />
            <span className='hidden md:block'>Tải lại</span>
          </Button>
        ]}
      />

      <Alert
        variant={
          queryBlockchainLicenseVerify.data?.dataMatched && queryBlockchainLicenseVerify.data?.fileMatched
            ? 'success'
            : 'destructive'
        }
        className='mx-auto max-w-[700px]'
      >
        {queryBlockchainLicenseVerify.data?.dataMatched && queryBlockchainLicenseVerify.data?.fileMatched ? (
          <CheckCircleIcon />
        ) : (
          <AlertCircleIcon />
        )}
        <AlertTitle>Xác thực giấy phép trên blockchain</AlertTitle>
        <AlertDescription>{queryBlockchainLicenseVerify.data?.message}</AlertDescription>
      </Alert>

      {queryBlockchainLicenseVerify.data?.dataMatched && (
        <DescriptionView
          title='Thông tin giấy phép'
          loading={queryBlockchainLicenseVerify.isLoading}
          errorText={queryBlockchainLicenseVerify.error?.message}
          items={[
            { icon: <Code />, title: 'Mã giấy phép', value: queryBlockchainLicenseVerify.data?.data.licenseCode },
            {
              icon: <BriefcaseBusiness />,
              title: 'Doanh nghiệp',
              value: (
                <Link
                  href={`/admin/business-management/${queryBlockchainLicenseVerify.data?.data.businessId}`}
                  className='font-semibold text-blue-500 hover:underline'
                >
                  {queryBlockchainLicenseVerify.data?.data.businessName}
                </Link>
              )
            },
            {
              icon: <FileText />,
              title: 'Mã hồ sơ',
              value: (
                <Link
                  href={`/admin/dossier-management/${queryBlockchainLicenseVerify.data?.data.dossierId}`}
                  className='font-semibold text-blue-500 hover:underline'
                >
                  {queryBlockchainLicenseVerify.data?.data.dossierCode}
                </Link>
              )
            },

            { icon: <Type />, title: 'Loại giấy phép', value: queryBlockchainLicenseVerify.data?.data.licenseType },
            {
              icon: <ChartArea />,
              title: 'Trạng thái',
              value: (
                <Badge>
                  {
                    LICENSE_STATUS_OPTIONS.find(
                      (option) => option.value === queryBlockchainLicenseVerify.data?.data.licenseStatus
                    )?.label
                  }
                </Badge>
              )
            },
            {
              icon: <CalendarCheck />,
              title: 'Ngày hiệu lực',
              value: queryBlockchainLicenseVerify.data?.data.effectiveDate
            },
            {
              icon: <CalendarX2 />,
              title: 'Ngày hết hạn',
              value: queryBlockchainLicenseVerify.data?.data.expirationDate
            },
            {
              icon: <Blocks />,
              title: 'Trạng thái blockchain',
              value: (
                <Badge>
                  {
                    BLOCKCHAIN_STATUS_OPTIONS.find(
                      (option) => option.value === queryBlockchainLicenseVerify.data?.data.blockchainStatus
                    )?.label
                  }
                </Badge>
              )
            }
          ]}
        />
      )}

      {queryBlockchainLicenseVerify.data?.fileMatched && (
        <>
          <Separator className='my-2 md:my-4' />
          <PageHeader title='Tệp giấy phép' />
          <PdfView queryFn={() => LicenseService.getLicenseFile(props.id)} idKey={'blockchain' + props.id} />
        </>
      )}
    </div>
  )
}

export default BlockchainLicenseDetailView
