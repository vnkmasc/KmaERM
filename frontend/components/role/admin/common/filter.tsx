'use client'

import CustomField from '@/components/common/custom-field'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { queryString } from '@/lib/utils/common'
import { IZodCustomField } from '@/types/form-field'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleXIcon, RefreshCcw, SearchIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Dispatch, SetStateAction } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

interface Props {
  items: IZodCustomField[]
  onFilter: Dispatch<SetStateAction<any>>
  defaultValues?: any
  refreshQuery: () => void
}

const Filter: React.FC<Props> = (props) => {
  const pathname = usePathname()
  const router = useRouter()

  const formSchema = z.object(
    props.items.reduce(
      (acc, obj) => {
        acc[obj.name] = obj.validator || z.any()
        return acc
      },
      {} as Record<string, z.ZodType>
    )
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: props.items.reduce(
      (acc, obj) => {
        acc[obj.name] = props.defaultValues?.[obj.name] ?? ''

        return acc
      },
      {} as Record<string, string>
    )
  })

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    props.onFilter(data)
    router.replace(`${queryString(data)}`)
  }
  const handleReset = () => {
    const emptyValues = props.items.reduce(
      (acc, obj) => {
        acc[obj.name] = ''
        return acc
      },
      {} as Record<string, string>
    )
    form.reset(emptyValues)
    props.onFilter(emptyValues)
    router.replace(pathname)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='row-span-2 self-center'>Tìm kiếm</CardTitle>
        <CardAction className='space-x-2'>
          <Button variant={'secondary'} onClick={props.refreshQuery}>
            <RefreshCcw />
            <span className='hidden md:block'>Làm mới</span>
          </Button>
          <Button variant='destructive' onClick={handleReset}>
            <CircleXIcon />
            <span className='hidden md:block'>Xóa bộ lọc</span>
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)}>
            <SearchIcon />
            <span className='hidden md:block'>Tìm kiếm</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5'>
            {props.items.map((prop, index) => (
              <CustomField {...prop} control={form.control} key={index} />
            ))}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default Filter
