import { clsx, type ClassValue } from 'clsx'
import { ExternalToast, toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import { format, isAfter, isBefore, parseISO, startOfDay } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const showNotification = (
  type: 'success' | 'error' | 'info' | 'warning' | 'message',
  description: string,
  setting?: ExternalToast
) => {
  return toast[type]('Thông báo', {
    description: description,
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

export const parseDateInputToISO = (dateStr: string | undefined): string | undefined => {
  if (!dateStr) return undefined

  if (dateStr.includes('T')) {
    // Nếu có thời gian, thêm 00:00:00 và gửi kèm theo UTC+7 (HCM VN))
    return dateStr + ':00+07:00'
  } else {
    // Nếu chỉ có ngày, mặc định gửi kèm theo Zulu time zone (mặc định))
    return dateStr + 'T00:00:00Z'
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

/**
 * Kiểm tra xem ngày thứ nhất có trước ngày thứ hai không
 * @param date1 - Ngày thứ nhất (định dạng ISO string)
 * @param date2 - Ngày thứ hai (định dạng ISO string)
 * @returns true nếu date1 trước date2, ngược lại false
 */
export const isDateISOBefore = (date1: string, date2: string): boolean => {
  const date1Obj = parseISO(date1)
  const date2Obj = parseISO(date2)
  return isBefore(date1Obj, date2Obj)
}

export const isDateAfterNow = (dateStr: string, includeTime = false): boolean => {
  try {
    const date = parseISO(dateStr)
    const now = new Date()

    if (!includeTime) {
      // Bỏ phần thời gian: so sánh theo ngày
      return isAfter(startOfDay(date), startOfDay(now))
    }

    return isAfter(date, now)
  } catch {
    return false
  }
}
