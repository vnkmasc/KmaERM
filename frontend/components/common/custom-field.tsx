import { ICustomField } from '@/types/form-field'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '../ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select'
import { Controller, ControllerRenderProps } from 'react-hook-form'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { CalendarIcon, Check, ChevronsUpDown, CircleX } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { cn, parseDateISOForInput, parseDateToISO } from '@/lib/utils/common'
import PasswordInput from './password-input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Switch } from '../ui/switch'
import { Calendar } from '../ui/calendar'

const CustomField: React.FC<ICustomField> = (props) => {
  const renderField = (field: ControllerRenderProps<any, string>) => {
    switch (props.type) {
      case 'input':
        return (
          <InputGroup>
            <InputGroupInput
              id={props.name}
              placeholder={props.placeholder}
              required={props.required}
              disabled={props.disabled}
              {...props.setting?.input}
              {...field}
            />
            <InputGroupAddon
              align={'inline-end'}
              hidden={props.setting && props.setting.input?.type !== 'text'}
              className='cursor-pointer'
              onClick={() => field.onChange('')}
            >
              <CircleX />
            </InputGroupAddon>
          </InputGroup>
        )
      case 'password':
        return <PasswordInput field={field} />

      case 'select':
        return (
          <Select
            required={props.required}
            disabled={props.disabled}
            onValueChange={field.onChange}
            value={field.value}
            defaultValue={field.value}
          >
            <SelectTrigger>
              <SelectValue placeholder={props.placeholder} id={props.name} />
            </SelectTrigger>
            <SelectContent>
              {props.setting?.select?.groups?.length && props.setting?.select?.groups?.length > 0 ? (
                props.setting?.select?.groups?.map((group, index) => (
                  <SelectGroup key={index}>
                    {group.label && <SelectLabel>{group.label}</SelectLabel>}
                    {group.options.map((option, index) => (
                      <SelectItem key={index} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))
              ) : (
                <div className='flex h-16 items-center justify-center px-5 text-sm'>Không có dữ liệu</div>
              )}
            </SelectContent>
          </Select>
        )
      case 'search_select':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                className={cn(
                  'hover:bg-background w-full justify-between px-3 py-1',
                  !field.value && 'text-muted-foreground hover:text-muted-foreground'
                )}
                disabled={props.disabled}
              >
                {field.value
                  ? props.setting?.select?.groups
                      ?.flatMap((group) => group.options)
                      ?.find((option) => option.value === field.value)?.label
                  : props.placeholder || 'Tìm kiếm và chọn'}
                <ChevronsUpDown className='opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[250px] p-0'>
              <Command>
                <CommandInput placeholder={'Nhập để tìm kiếm'} className='h-9' />
                <CommandList>
                  <CommandEmpty>Không tìm thấy kết quả</CommandEmpty>
                  {props.setting?.select?.groups?.map((group, groupIndex) => (
                    <CommandGroup key={groupIndex} heading={group.label}>
                      {group.options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={(currentValue) => {
                            const selectedOption = group.options.find(
                              (opt) => opt.label.toLowerCase() === currentValue.toLowerCase()
                            )
                            if (selectedOption) {
                              field.onChange(selectedOption.value === field.value ? '' : selectedOption.value)
                            }
                          }}
                        >
                          {option.label}
                          <Check
                            className={cn('ml-auto', field.value === option.value ? 'opacity-100' : 'opacity-0')}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )
      case 'switch':
        return (
          <Switch
            id={props.name}
            checked={!!field.value}
            onCheckedChange={(checked) => field.onChange(checked)}
            disabled={props.disabled}
          />
        )
      case 'date_picker':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                id={props.name}
                className='w-48 justify-between font-normal'
                disabled={props.disabled}
              >
                {field.value ? parseDateISOForInput(field.value, props.setting?.date?.includeTime) : 'Chọn thời gian'}
                <CalendarIcon className='text-muted-foreground' />
              </Button>
            </PopoverTrigger>
            <PopoverContent side='top' align='start' className='w-auto overflow-hidden p-0'>
              <Calendar
                mode='single'
                selected={field.value ? new Date(field.value) : undefined}
                captionLayout='dropdown'
                onSelect={(date) => {
                  field.onChange(parseDateToISO(date, props.setting?.date?.includeTime))
                }}
              />
            </PopoverContent>
          </Popover>
        )
    }
  }

  return props.type === 'switch' ? (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={!!fieldState.error}
          orientation={'horizontal'}
          className={cn(
            'rounded-md border border-gray-300 p-3 transition-all',
            field.value && 'border-primary bg-primary/30'
          )}
        >
          <FieldContent>
            {props.label && <FieldLabel htmlFor={props.name}>{props.label}</FieldLabel>}

            {props.description && <FieldDescription>{props.description}</FieldDescription>}
            <FieldError>{fieldState.error?.message}</FieldError>
          </FieldContent>
          {renderField(field)}
        </Field>
      )}
    />
  ) : (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error} className='-space-y-1'>
          {props.label && <FieldLabel htmlFor={props.name}>{props.label}</FieldLabel>}

          {renderField(field)}
          {props.description && <FieldDescription>{props.description}</FieldDescription>}
          <FieldError>{fieldState.error?.message}</FieldError>
        </Field>
      )}
    />
  )
}

export default CustomField
