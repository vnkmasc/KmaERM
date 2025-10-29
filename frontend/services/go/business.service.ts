import { queryString } from '@/types/common'
import goService from '.'
import { PAGE_SIZE } from '@/constants/common'

export default class BusinessService {
  static async searchBusinesses(params: Record<string, any>, page: number) {
    const res = await goService('/doanh-nghiep' + queryString({ ...params, page, limit: PAGE_SIZE }))
    return res
  }
}
