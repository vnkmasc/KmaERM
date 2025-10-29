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
