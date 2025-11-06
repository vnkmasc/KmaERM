import { queryString } from '@/lib/utils/common'
import goService from '.'
import { PAGE_SIZE } from '@/constants/common'
import { formatBusiness } from '@/lib/utils/format-api'
import { IBusiness, IUpdateBusinessCode } from '@/types/business'
import { IOption } from '@/types/form-field'

export default class BusinessService {
  static async searchBusinesses(params: Record<string, any>) {
    const res = await goService('/doanh-nghiep' + queryString({ ...params, limit: PAGE_SIZE }))

    return {
      data: res.data.map((item: any) => formatBusiness.dataGetted(item)),
      limit: res.limit,
      page: res.page,
      totalPage: Math.ceil(res.total / res.limit)
    }
  }

  static async searchBusinessesByVIName(name: string): Promise<IOption[]> {
    const res = await goService('/doanh-nghiep' + queryString({ ten_vi: name.trim(), limit: PAGE_SIZE }))
    return res.data.map((item: any) => formatBusiness.optionSelectGetted(item))
  }

  static async getBusinessById(id: string) {
    const res = await goService('/doanh-nghiep/' + id)

    return formatBusiness.dataGetted(res.data)
  }

  static async createBusiness(data: IBusiness) {
    const res = await goService('/doanh-nghiep', {
      method: 'POST',
      body: JSON.stringify(formatBusiness.dataSent(data))
    })

    return res
  }

  static async updateBusiness(id: string, data: IBusiness) {
    const res = await goService(`/doanh-nghiep/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formatBusiness.dataSent(data))
    })
    return res
  }

  static async deleteBusiness(id: string) {
    const res = await goService(`/doanh-nghiep/${id}`, {
      method: 'DELETE'
    })
    return res
  }

  static async changeBusinessCode(id: string, data: IUpdateBusinessCode) {
    const res = await goService(`/doanh-nghiep/${id}/changemsdn`, {
      method: 'PUT',
      body: JSON.stringify(formatBusiness.updateBusinessCodeSent(data))
    })
    return res
  }

  static async uploadRegistrationCertificate(id: string, file: FormData) {
    const res = await goService(`/doanh-nghiep/${id}/uploadgcn`, {
      method: 'POST',
      body: file
    })
    return res
  }

  static async getRegistrationCertificate(id: string): Promise<Blob> {
    const res = await goService(
      `/doanh-nghiep/${id}/viewgcn`,
      {
        method: 'GET'
      },
      true
    )
    return res
  }
}
