import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Skeleton } from '../ui/skeleton'

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
        <CardAction className='flex gap-2'>{props.actions?.map((action) => action)}</CardAction>
      </CardHeader>
      <CardContent className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {props.loading ? (
          <div>
            <Skeleton className='mb-2 h-4 w-1/2' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='mb-2 h-4 w-1/2' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='mb-2 h-4 w-1/2' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='mb-2 h-4 w-1/2' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='mb-2 h-4 w-1/2' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='mb-2 h-4 w-1/2' />
            <Skeleton className='h-4 w-full' />
          </div>
        ) : (
          props.items.map((item, index) => <ViewItem key={index} {...item} />)
        )}
      </CardContent>
    </Card>
  )
}

export default DecriptionView
