import { IBusiness, IUpdateBusinessCode } from '@/types/business'
import { parseCurrencyToNumber, parseDateInputToISO, parseDateISOForInput, parseNumberToVNDCurrency } from './common'
import { IDossierDocument, IDossier, IDossierDialogData, IDossierTableData } from '@/types/dossier'
import { IOption } from '@/types/form-field'
import { ILicense, ILicenseTableData } from '@/types/license'

export const formatBusiness = {
  dataGetted(data: any): IBusiness {
    return {
      id: data.id,
      viName: data.ten_doanh_nghiep_vi,
      enName: data.ten_doanh_nghiep_en,
      shortName: data.ten_viet_tat,
      address: data.dia_chi,
      businessCode: data.ma_so_doanh_nghiep,
      firstIssuedDate: parseDateISOForInput(data.ngay_cap_msdn_lan_dau),
      issuedBy: data.noi_cap_msdn,
      phoneNumber: data.sdt,
      email: data.email,
      website: data.website,
      charterCapital: parseCurrencyToNumber(data.von_dieu_le),
      legalRepresentative: data.nguoi_dai_dien,
      position: data.chuc_vu,
      idType: data.loai_dinh_danh,
      idIssuedDate: parseDateISOForInput(data.ngay_cap_dinh_danh),
      idIssuedBy: data.noi_cap_dinh_danh,
      status: data.status,
      certificateFilePath: data.file_gcndkdn,
      businessCodeChangeCount: data.so_lan_thay_doi_msdn,
      businessCodeChangeDate: data.ngay_thay_doi_msdn
    }
  },

  dataSent(data: IBusiness): any {
    return {
      ten_doanh_nghiep_vi: data.viName,
      ten_doanh_nghiep_en: data.enName,
      ten_viet_tat: data.shortName,
      dia_chi: data.address,
      ma_so_doanh_nghiep: data.businessCode,
      ngay_cap_msdn_lan_dau: parseDateInputToISO(data.firstIssuedDate),
      noi_cap_msdn: data.issuedBy,
      sdt: data.phoneNumber,
      email: data.email ? data.email : undefined,
      website: data.website ? data.website : undefined,
      von_dieu_le: parseNumberToVNDCurrency(data.charterCapital),
      nguoi_dai_dien: data.legalRepresentative,
      chuc_vu: data.position,
      loai_dinh_danh: data.idType,
      ngay_cap_dinh_danh: parseDateInputToISO(data.idIssuedDate),
      noi_cap_dinh_danh: data.idIssuedBy,
      status: data.status
    }
  },

  updateBusinessCodeSent(data: IUpdateBusinessCode): any {
    return {
      ma_so_doanh_nghiep_moi: data.newBusinessCode,
      ngay_thay_doi: parseDateInputToISO(data.changedDate),
      noi_cap_moi: data.issuedBy
    }
  },

  optionSelectGetted(data: any): IOption {
    return {
      label: data.ten_doanh_nghiep_vi,
      value: data.id
    }
  }
}

export const formatDossier = {
  tableDataGetted(data: any): IDossierTableData {
    return {
      id: data.id,
      businessId: data.doanh_nghiep_id,
      businessName: data.ten_doanh_nghiep_vi,
      dossierType: data.loai_thu_tuc,
      dossierCode: data.ma_ho_so,
      dossierStatus: data.trang_thai_ho_so,
      issuedDate: parseDateISOForInput(data.ngay_dang_ky, true),
      receivedDate: parseDateISOForInput(data.ngay_tiep_nhan, true),
      expectedReturnDate: parseDateISOForInput(data.ngay_hen_tra, true)
    }
  },
  dialogDataSent(data: IDossierDialogData, isCreate: boolean, businessId?: string): any {
    const dataSent = {
      loai_thu_tuc: data.dossierType,
      ngay_dang_ky: parseDateInputToISO(data.issuedDate),
      ngay_tiep_nhan: parseDateInputToISO(data.receivedDate),
      ngay_hen_tra: parseDateInputToISO(data.expectedReturnDate)
    }

    return isCreate
      ? { ...dataSent, doanh_nghiep_id: businessId }
      : { ...dataSent, trang_thai_ho_so: data.dossierStatus }
  },
  dataSent(data: IDossier): any {
    return {
      ma_ho_so: data.dossierCode,
      loai_thu_tuc: data.dossierType,
      trang_thai_ho_so: data.dossierStatus,
      ngay_dang_ky: data.issuedDate,
      ngay_tiep_nhan: data.receivedDate,
      ngay_hen_tra: data.expectedReturnDate
    }
  },
  documentItemGetted(data: any): IDossierDocument {
    return {
      id: data.id,
      type: {
        id: data.loai_tai_lieu.id,
        name: data.loai_tai_lieu.ten,
        description: data.loai_tai_lieu.mo_ta
      },
      files: data.tai_lieus?.map((file: any) => ({
        id: file.id,
        title: file.tieu_de,
        path: file.duong_dan
      }))
    }
  }
}

export const formatLicense = {
  dataGetted(data: any): ILicense {
    return {
      id: data.id,
      dossierId: data.ho_so_id,
      licenseType: data.loai_giay_phep,
      licenseCode: data.so_giay_phep,
      licenseStatus: data.trang_thai_giay_phep,
      effectiveDate: parseDateISOForInput(data.ngay_hieu_luc),
      expirationDate: parseDateISOForInput(data.ngay_het_han),
      blockchainStatus: data.trang_thai_blockchain
    }
  },
  dataSent(data: ILicense): any {
    return {
      ho_so_id: data.dossierId,
      loai_giay_phep: data.licenseType,
      so_giay_phep: data.licenseCode,
      trang_thai_giay_phep: data.licenseStatus,
      ngay_hieu_luc: parseDateInputToISO(data.effectiveDate),
      ngay_het_han: parseDateInputToISO(data.expirationDate)
    }
  },
  tableDataGetted(data: any): ILicenseTableData {
    return {
      id: data.id,
      dossierId: data.ho_so_id,
      licenseType: data.loai_giay_phep,
      licenseCode: data.so_giay_phep,
      licenseStatus: data.trang_thai_giay_phep,
      effectiveDate: parseDateISOForInput(data.ngay_hieu_luc),
      expirationDate: parseDateISOForInput(data.ngay_het_han),
      businessId: data.ho_so.doanh_nghiep.id,
      businessName: data.ho_so.doanh_nghiep.ten_doanh_nghiep_vi,
      dossierCode: data.ho_so.ma_ho_so,
      filePath: data.file_duong_dan,
      blockchainStatus: data.trang_thai_blockchain
    }
  }
}
