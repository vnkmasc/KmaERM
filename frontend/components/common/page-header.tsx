import { ButtonGroup } from '../ui/button-group'
import Back from './back'

interface Props {
  title: string
  actions?: React.ReactNode[]
  hasBackButton?: boolean
}

const PageHeader: React.FC<Props> = (props) => {
  return (
    <div className='flex items-center justify-between'>
      <h2 className='flex items-center gap-2'>
        {props.hasBackButton && <Back />}
        {props.title}
      </h2>
      <ButtonGroup>{props.actions?.map((item) => item)}</ButtonGroup>
    </div>
  )
}

export default PageHeader
