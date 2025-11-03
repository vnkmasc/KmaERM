import { InputHTMLAttributes } from 'react'
import { Control } from 'react-hook-form'
import z from 'zod'

export interface IOption {
  label: string
  value: string
}

export interface ISelectGroup {
  label: string
  options: IOption[]
}

export interface ICustomField {
  type: 'input' | 'select' | 'search_select' | 'password' | 'switch' | 'date_picker'
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
    date?: {
      includeTime: boolean
      mode?: 'single' | 'range' | 'multiple'
    }
  }
}

export interface IZodCustomField extends Omit<ICustomField, 'control'> {
  validator?: z.ZodType
}
