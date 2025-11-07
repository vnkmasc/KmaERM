import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { CheckCircle2Icon } from 'lucide-react'

interface Props {
  businessName: string
  dossierCode?: string
  isUpdateMode?: boolean
}

const BeforeContentInfoDialog: React.FC<Props> = (props) => {
  return (
    <div className='-mb-2 space-y-2 px-6'>
      <Alert variant={'success'}>
        <CheckCircle2Icon />
        <AlertTitle>Sẵn sàng {props.isUpdateMode ? 'chỉnh sửa' : 'tạo'} hồ sơ cho doanh nghiệp</AlertTitle>
        <AlertDescription>{props.businessName}</AlertDescription>
      </Alert>
      {props.isUpdateMode && (
        <div className='flex gap-2'>
          <Label>Mã hồ sơ:</Label>
          <span className='text-muted-foreground'>{props.dossierCode}</span>
        </div>
      )}
    </div>
  )
}

export default BeforeContentInfoDialog
