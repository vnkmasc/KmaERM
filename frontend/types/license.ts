export interface ILicense {
  id: string
  licenseCode: string
  dossierId: string
  licenseType: string
  licenseStatus: string
  effectiveDate: string
  expirationDate: string
  filePath?: string
  blockchainStatus?: string
}

export interface ILicenseSearchParams {
  businessId?: string
  licenseCode?: string
  dossierCode?: string
  licenseType?: string
  licenseStatus?: string
  effectiveDateFrom?: string
  effectiveDateTo?: string
  expirationDateFrom?: string
  expirationDateTo?: string
  page: number
}

export interface ILicenseTableData extends ILicense {
  dossierCode: string
  businessName: string
  businessId: string
}
