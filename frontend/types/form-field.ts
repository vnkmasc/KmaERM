import { InputHTMLAttributes } from 'react'
import { Control } from 'react-hook-form'
import z from 'zod'

export interface IOption {
  label: string
  value: string
}

export interface ISelectGroup {
  label: string | undefined
  options: IOption[]
}

export interface ICustomField {
  type: 'input' | 'select' | 'search_select' | 'password' | 'switch' | 'query_select'
  name: string
  control: Control<any>
  label?: string
  placeholder?: string
  description?: string
  disabled?: boolean
  required?: boolean
  setting?: {
    input?: InputHTMLAttributes<HTMLInputElement>
    select?: {
      groups: ISelectGroup[]
    }
    querySelect?: {
      // eslint-disable-next-line no-unused-vars
      queryFn: (keyword: string) => Promise<IOption[]>
    }
  }
}

export interface IZodCustomField extends Omit<ICustomField, 'control'> {
  validator?: z.ZodType
}
