export interface IBusiness {
  id: string
  viName: string
  enName?: string
  abbreviation?: string
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
}
