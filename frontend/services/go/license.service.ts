import { queryString } from '@/lib/utils/common'
import goService from '.'
import { PAGE_SIZE } from '@/constants/common'
import { formatLicense } from '@/lib/utils/format-api'
import { ILicense } from '@/types/license'

export default class LicenseService {
  static async searchLicenses(params: Record<string, any>) {
    const res = await goService('/giay-phep' + queryString({ ...params, limit: PAGE_SIZE }))

    return {
      data: res.data.map((item: any) => formatLicense.tableDataGetted(item)),
      limit: res.limit,
      page: res.page,
      totalPage: Math.ceil(res.total / res.limit)
    }
  }

  static async getLicenseById(id: string) {
    const res = await goService(`/giay-phep/${id}`)

    return formatLicense.dataGetted(res.data)
  }

  static async getLicenseByIdWithBusiness(id: string) {
    const res = await goService(`/giay-phep/${id}`)

    return formatLicense.tableDataGetted(res.data)
  }

  static async createLicense(data: ILicense) {
    const res = await goService('/giay-phep', {
      method: 'POST',
      body: JSON.stringify(formatLicense.dataSent(data))
    })

    return res
  }

  static async updateLicense(id: string, data: ILicense) {
    const res = await goService(`/giay-phep/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formatLicense.dataSent(data))
    })

    return res
  }

  static async deleteLicense(id: string) {
    const res = await goService(`/giay-phep/${id}`, {
      method: 'DELETE'
    })

    return res
  }

  static async uploadLicenseFile(id: string, file: FormData) {
    const res = await goService(`/giay-phep/${id}/upload`, {
      method: 'POST',
      body: file
    })

    return res
  }

  static async getLicenseFile(id: string): Promise<Blob> {
    const res = await goService(
      `/giay-phep/${id}/view-file`,
      {
        method: 'GET'
      },
      true
    )

    return res
  }

  static async uploadBlockchainLicense(id: string) {
    const res = await goService(`/giay-phep/${id}/push-blockchain`, {
      method: 'POST'
    })

    return res
  }

  static async verifyBlockchainLicense(id: string) {
    const res = await goService(`/giay-phep/${id}/verify`)

    return {
      message: res.message,
      data: formatLicense.tableDataGetted(res.giay_phep_data),
      dataMatched: res.is_h1_matched,
      fileMatched: res.is_h2_matched
    }
  }
}
