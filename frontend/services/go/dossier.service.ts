import { queryString } from '@/lib/utils/common'
import goService from '.'
import { PAGE_SIZE } from '@/constants/common'
import { formatDossier } from '@/lib/utils/format-api'

export default class DossierService {
  static async searchDossiers(params: Record<string, any>) {
    const res = await goService('/ho-so' + queryString({ ...params, limit: PAGE_SIZE }))

    return {
      data: res.data.map((item: any) => formatDossier.tableDataGetted(item)),
      limit: res.limit,
      page: res.page,
      total: res.total
    }
  }
}
