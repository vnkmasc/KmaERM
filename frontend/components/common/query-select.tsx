'use client'

import { ICustomField } from '@/types/form-field'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '../ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils/common'
import { Spinner } from '../ui/spinner'
import { ControllerRenderProps } from 'react-hook-form'

type Props = ICustomField & {
  field: ControllerRenderProps<any, string>
}

const QuerySelect: React.FC<Props> = (props) => {
  const [searchText, setSearchText] = useState<string>('')
  const pathname = usePathname()

  const { data, isLoading } = useSWR(pathname + searchText, () => props.setting?.querySelect?.queryFn(searchText), {
    isPaused() {
      return !searchText
    }
  })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          className={cn(
            'hover:bg-background',
            !props.field.value && 'text-muted-foreground hover:text-muted-foreground'
          )}
          disabled={props.disabled}
        >
          <p className='flex-1 overflow-hidden text-start text-ellipsis'>
            {props.field.value
              ? (data ?? []).find((item) => item.value === props.field.value)?.label || props.field.value
              : props.placeholder || 'Tìm kiếm và chọn'}
          </p>
          {isLoading ? <Spinner className='opacity-50' /> : <ChevronsUpDown className='opacity-50' />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='min-w-[250px] p-0' side='bottom' align='start'>
        <Command>
          <CommandInput
            placeholder={'Nhập để tìm kiếm'}
            className='h-9'
            onChangeCapture={(e: React.ChangeEvent<HTMLInputElement>) => {
              {
                if (e.target.value.length > 2) {
                  setTimeout(() => {
                    setSearchText((e.target as HTMLInputElement).value)
                  }, 200)
                }
              }
            }}
          />
          <CommandList>
            <CommandEmpty>Không tìm thấy kết quả</CommandEmpty>
            {(data ?? []).map((item, idx: number) => (
              <CommandItem
                key={idx}
                value={item.label}
                onSelect={(currentValue) => {
                  if (item.label.toLowerCase() === currentValue.toLowerCase()) {
                    props.field.onChange(item.value === props.field.value ? '' : item.value)
                  }
                }}
                className='cursor-pointer'
              >
                {item.label}
                <Check className={cn('ml-auto', props.field.value === item.value ? 'opacity-100' : 'opacity-0')} />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default QuerySelect
