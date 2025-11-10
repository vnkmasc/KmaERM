export interface IDossierDocument {
  id: string
  type: {
    id: string
    name: string
    description: string
  }
  files?: { id: string; title: string; path: string }[]
}

export interface IDossier {
  id: string
  businessId: string
  businessName: string
  dossierCode: string
  dossierType: string
  dossierStatus: string
  issuedDate: string
  receivedDate: string
  expectedReturnDate: string
  documents: IDossierDocument[]
}

export type IDossierTableData = Omit<IDossier, 'documents'>

export interface IDossierDialogData {
  dossierType: string
  issuedDate: string
  receivedDate: string
  expectedReturnDate: string
  dossierStatus: string
  dossierCode?: string
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
