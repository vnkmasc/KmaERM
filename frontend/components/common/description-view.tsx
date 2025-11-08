import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { cn } from '@/lib/utils/common'
import { ButtonGroup } from '../ui/button-group'

interface ViewItemProps {
  icon: React.ReactNode
  title: string
  value: string | number | React.ReactNode
}

interface Props {
  items: ViewItemProps[]
  title: any
  description?: string
  actions?: React.ReactNode[]
  loading?: boolean
  errorText?: string
}

const ViewItem: React.FC<ViewItemProps> = (props) => {
  return (
    <div className='flex items-center gap-2'>
      <span> {props.icon}</span>
      <div>
        <p className='mb-1 text-sm font-medium'>{props.title}</p>
        <div className='text-sm text-gray-500'>
          {props.value ?? <span className='text-gray-500 italic'>Không có dữ liệu</span>}{' '}
        </div>
      </div>
    </div>
  )
}

const DecriptionView: React.FC<Props> = (props) => {
  return props.errorText ? (
    <Alert variant={'destructive'} className='mx-auto max-w-[700px]'>
      <AlertCircle />
      <AlertTitle>Đã có lỗi khi tải {props.title}</AlertTitle>
      <AlertDescription>{props.errorText}</AlertDescription>
    </Alert>
  ) : (
    <Card>
      <CardHeader>
        <CardTitle className={cn(!props.description && 'row-span-2 self-center')}>{props.title}</CardTitle>
        {props.description && <CardDescription>{props.description}</CardDescription>}
        <CardAction>
          <ButtonGroup>{props.actions?.map((action) => action)}</ButtonGroup>
        </CardAction>
      </CardHeader>
      <CardContent className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {props.loading ? (
          <div className='col-span-full space-y-2'>
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-6 w-3/4' />
          </div>
        ) : (
          props.items.map((item, index) => <ViewItem key={index} {...item} />)
        )}
      </CardContent>
    </Card>
  )
}

export default DecriptionView
