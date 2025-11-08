import { queryString } from '@/lib/utils/common'
import goService from '.'
import { PAGE_SIZE } from '@/constants/common'
import { formatDossier } from '@/lib/utils/format-api'
import { IDossier, IDossierDialogData } from '@/types/dossier'
import { IOption } from '@/types/form-field'

export default class DossierService {
  static async searchDossiers(params: Record<string, any>) {
    const res = await goService('/ho-so' + queryString({ ...params, limit: PAGE_SIZE }))

    return {
      data: res.data.map((item: any) => formatDossier.tableDataGetted(item)),
      limit: res.page_size,
      page: res.page,
      totalPage: Math.ceil(res.total / res.page_size)
    }
  }

  static async getAllDossiersOfBusiness(businessId: string) {
    const res = await goService(`/ho-so` + queryString({ doanh_nghiep_id: businessId, limit: 100 }))

    return res.data.map(
      (item: any) =>
        ({
          value: item.id,
          label: item.ma_ho_so
        }) as IOption
    )
  }

  static async createDossier(data: IDossierDialogData, businessId: string) {
    const res = await goService('/ho-so', {
      method: 'POST',
      body: JSON.stringify(formatDossier.dialogDataSent(data, true, businessId))
    })

    return res
  }

  static async updateDossier(id: string, data: IDossierDialogData) {
    const res = await goService(`/ho-so/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formatDossier.dialogDataSent(data, false))
    })

    return res
  }

  static async getDossierById(id: string): Promise<IDossier> {
    const res = await goService(`/ho-so/${id}`)

    return {
      ...formatDossier.tableDataGetted(res),
      documents: res.ho_so_tai_lieus?.map((item: any) => formatDossier.documentItemGetted(item)) || []
    }
  }

  static async deleteDossier(id: string) {
    const res = await goService(`/ho-so/${id}`, {
      method: 'DELETE'
    })

    return res
  }

  static async uploadDossierDocument(dossierDocumentId: string, file: FormData) {
    const formData = new FormData()
    formData.append('file', file.get('file') as Blob)
    formData.append('ho_so_tai_lieu_id', dossierDocumentId)
    const res = await goService('/tai-lieu/upload', {
      method: 'POST',
      body: formData
    })

    return res
  }

  static async viewDossierDocument(dossierDocumentId: string): Promise<Blob> {
    const res = await goService(
      `/tai-lieu/download/${dossierDocumentId}`,
      {
        method: 'GET'
      },
      true
    )

    return res
  }

  static async deleteDossierDocument(dossierDocumentId: string) {
    const res = await goService(`/tai-lieu/${dossierDocumentId}`, {
      method: 'DELETE'
    })

    return res
  }
}
