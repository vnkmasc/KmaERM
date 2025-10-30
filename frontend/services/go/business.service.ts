import { queryString } from '@/lib/utils/common'
import goService from '.'
import { PAGE_SIZE } from '@/constants/common'
import { formatBusiness } from '@/lib/utils/format-api'

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
}
