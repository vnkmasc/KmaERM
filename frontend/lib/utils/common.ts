import { clsx, type ClassValue } from 'clsx'
import { ExternalToast, toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

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

export const parseDateISOForInput = (isoString: string, includeTime: boolean = false): string => {
  try {
    const date = parseISO(isoString)

    // format theo chế độ
    return includeTime
      ? format(date, "yyyy-MM-dd'T'HH:mm") // dành cho input[type="datetime-local"]
      : format(date, 'yyyy-MM-dd') // dành cho input[type="date"]
  } catch {
    return ''
  }
}

export const parseDateInputToISO = (dateStr: string | undefined, includeTime: boolean = false): string | undefined => {
  if (!dateStr) return undefined

  if (includeTime) {
    // Khi có thời gian, parse như bình thường và convert sang UTC
    const fullStr = dateStr.includes('T') ? dateStr : `${dateStr}T00:00`
    const date = new Date(fullStr)
    const iso = date.toISOString()
    return iso.replace(/:\d{2}\.\d{3}Z$/, ':00Z')
  } else {
    // Khi chỉ có ngày, tạo ISO string trực tiếp ở UTC 00:00:00 để tránh timezone shift
    // Ví dụ: "2025-11-08" -> "2025-11-08T00:00:00Z"
    return `${dateStr}T00:00:00Z`
  }
}

export const parseCurrencyToNumber = (value: string): number => {
  if (!value) return 0

  // Loại bỏ các ký tự không phải số
  const digits = value.replace(/\D/g, '')

  // Ép về number
  return digits ? Number(digits) : 0
}

export const parseNumberToVNDCurrency = (value: number | undefined): string | undefined => {
  if (value === undefined || isNaN(value)) return undefined

  return (
    value
      .toLocaleString('vi-VN') // format theo chuẩn Việt Nam
      .replace(/,/g, '.') + // đảm bảo dùng dấu . làm phân cách nghìn
    ' VNĐ'
  )
}

export const windowOpenBlankBlob = (blob: Blob) => {
  // Tạo URL từ Blob
  const blobUrl = URL.createObjectURL(blob)

  // Mở file trong tab mới
  const newWindow = window.open(blobUrl, '_blank')

  // Revoke URL sau khi window được load để giải phóng bộ nhớ
  // hoặc sau 1 phút nếu window không mở được
  if (newWindow) {
    newWindow.onload = () => {
      URL.revokeObjectURL(blobUrl)
    }
  } else {
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl)
    }, 60000)
  }
}
