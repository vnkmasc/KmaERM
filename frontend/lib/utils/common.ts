import { clsx, type ClassValue } from 'clsx'
import { ExternalToast, toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const showNotification = (
  type: 'success' | 'error' | 'info' | 'warning' | 'message',
  description: string,
  setting?: ExternalToast
) => {
  return toast[type]('Thông báo', {
    description:
      description ||
      {
        success: 'Thao tác thành công',
        error: 'Thao tác thất bại',
        info: 'Thông tin',
        warning: 'Cảnh báo',
        message: 'Tin nhắn'
      }[type],
    classNames: {
      success: '[&_svg]:!text-green-500',
      error: '[&_svg]:!text-red-500',
      info: '[&_svg]:!text-blue-500',
      warning: '[&_svg]:!text-yellow-500'
    },
    ...setting
  })
}

export const queryString = (params: Record<string, any>): string => {
  const query = Object.entries(params)
    .filter(([, value]) => Boolean(value)) // bỏ giá trị falsy
    .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(String(value)))
    .join('&')

  return query ? `?${query}` : ''
}

export function searchParamsToObject(searchParams: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    obj[key] = value
  }
  return obj
}

export const getInitialSearchParamsToObject = (): Record<string, string> => {
  if (typeof window === 'undefined') return {}
  const searchParams = new URLSearchParams(window.location.search)
  return searchParamsToObject(searchParams)
}
