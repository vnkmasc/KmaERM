import { queryString } from '@/lib/utils/common'
import goService from '.'
import { PAGE_SIZE } from '@/constants/common'
import { formatBusiness } from '@/lib/utils/format-api'
import { IBusiness } from '@/types/business'

export default class BusinessService {
  static async searchBusinesses(params: Record<string, any>) {
    const res = await goService('/doanh-nghiep' + queryString({ ...params, limit: PAGE_SIZE }))

    return {
      data: res.data.map((item: any) => formatBusiness.dataGetted(item)),
      limit: res.limit,
      page: res.page,
      total: res.total
    }
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
}
