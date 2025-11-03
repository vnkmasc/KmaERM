export interface IBusiness {
  id: string
  viName: string
  enName?: string
  shortName?: string
  address: string
  businessCode: string
  firstIssuedDate: string
  issuedBy: string
  phoneNumber?: string
  email?: string
  website?: string
  charterCapital?: number
  legalRepresentative?: string
  position?: string
  idType?: string
  status: boolean
  idIssuedDate?: string
  idIssuedBy?: string
  certificateFilePath?: string
  businessCodeChangeCount?: number
  businessCodeChangeDate?: string
}

export interface IBusinessSearchParams {
  shortName?: string
  viName?: string
  enName?: string
  businessCode?: string
  page: number
}

export interface IUpdateBusinessCode {
  newBusinessCode: string
  changedDate: string
  issuedBy: string
}

export interface IUpdateBusinessSetup {
  businessCode: string
  id: string
}
