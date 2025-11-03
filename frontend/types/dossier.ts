export interface IDocument {
  id: string
  type: {
    id: string
    name: string
    description: string
  }
}

export interface IDossierTableData {
  id: string
  businessId: string
  viBusinessName: string
  dossierCode: string
  dossierType: string
  dossierStatus: string
  issuedDate: string
  receivedDate: string
  expectedReturnDate: string
}

export interface IDossier {
  id: string
  businessId: string
  dossierCode: string
  dossierType: string
  dossierStatus: string
  issuedDate: string
  receivedDate: string
  expectedReturnDate: string
  documents: IDocument[]
}

export interface IDossierSearchParams {
  businessId?: string
  dossierStatus?: string
  dossierCode?: string
  dateType?: string
  from?: string
  to?: string
  page: number
}
