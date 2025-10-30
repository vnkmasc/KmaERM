import { IBusiness } from '@/types/business'

export const formatBusiness = {
  dataGetted(data: any): IBusiness {
    return {
      id: data.id,
      viName: data.ten_doanh_nghiep_vi,
      enName: data.ten_doanh_nghiep_en,
      abbreviation: data.ten_viet_tat,
      address: data.dia_chi,
      businessCode: data.ma_so_doanh_nghiep,
      firstIssuedDate: data.ngay_cap_msdn_lan_dau,
      issuedBy: data.noi_cap_msdn,
      phoneNumber: data.sdt,
      email: data.email,
      website: data.website,
      charterCapital: data.von_dieu_le,
      legalRepresentative: data.nguoi_dai_dien,
      position: data.chuc_vu,
      idType: data.loai_dinh_danh,
      idIssuedDate: data.ngay_cap_dinh_danh,
      idIssuedBy: data.noi_cap_dinh_danh,
      status: data.status
    }
  },

  dataSent(data: IBusiness): any {
    return {
      id: data.id,
      ten_doanh_nghiep_vi: data.viName,
      ten_doanh_nghiep_en: data.enName,
      ten_viet_tat: data.abbreviation,
      dia_chi: data.address,
      ma_so_doanh_nghiep: data.businessCode,
      ngay_cap_msdn_lan_dau: data.firstIssuedDate,
      noi_cap_msdn: data.issuedBy,
      sdt: data.phoneNumber,
      email: data.email,
      website: data.website,
      von_dieu_le: data.charterCapital,
      nguoi_dai_dien: data.legalRepresentative,
      chuc_vu: data.position,
      loai_dinh_danh: data.idType,
      ngay_cap_dinh_danh: data.idIssuedDate,
      noi_cap_dinh_danh: data.idIssuedBy,
      status: data.status
    }
  }
}
