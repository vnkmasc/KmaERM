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
  Edit,
  Globe,
  Mail,
  Map,
  MapPinHouse,
  Phone,
  RefreshCcw,
  Type,
  UserRoundPen,
  UserStar
} from 'lucide-react'
import useSWR from 'swr'
import BusinessService from '@/services/go/business.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import UploadBusinessCertificate from './upload-business-certificate'

interface Props {
  id: string
}

const BusinessDetailView: React.FC<Props> = (props) => {
  const queryBusinessDetail = useSWR(`business-${props.id}`, () => BusinessService.getBusinessById(props.id as string))

  const refetchAll = () => {
    queryBusinessDetail.mutate()
  }

  return (
    <div className='flex flex-col gap-4'>
      <PageHeader
        title='Chi tiết thông tin doanh nghiệp'
        hasBackButton
        actions={[
          <Button key='reload' variant='outline' onClick={refetchAll}>
            <RefreshCcw />
            <span className='hidden md:block'>Tải lại</span>
          </Button>,
          <UploadBusinessCertificate key={'upload-business-certificate'} businessId={props.id} />
        ]}
      />
      <DescriptionView
        loading={queryBusinessDetail.isLoading}
        actions={[
          <Button variant='outline' key='update'>
            <Edit /> <span className='hidden md:block'>Chỉnh sửa</span>
          </Button>,
          <Button
            key='change-business-code'
            title='Chỉnh sửa mã số doanh nghiệp'
            // onClick={() => props.onSetUpdateBusinessSetup({ businessCode: props.item.businessCode, id: props.item.id })}
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
          { icon: <Calendar />, title: 'Ngày cấp lần đầu MSDN', value: queryBusinessDetail.data?.firstIssuedDate },
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
          { icon: <Calendar />, title: 'Ngày cấp định danh', value: queryBusinessDetail.data?.idIssuedDate },
          { icon: <Map />, title: 'Nơi cấp định danh', value: queryBusinessDetail.data?.issuedBy },
          { icon: <DollarSign />, title: 'Vốn điều lệ', value: queryBusinessDetail.data?.charterCapital + ' VND' },
          { icon: <Mail />, title: 'Email', value: queryBusinessDetail.data?.email },
          { icon: <Globe />, title: 'Website', value: queryBusinessDetail.data?.website },
          { icon: <Phone />, title: 'Số điện thoại', value: queryBusinessDetail.data?.phoneNumber }
        ]}
      />
    </div>
  )
}

export default BusinessDetailView
