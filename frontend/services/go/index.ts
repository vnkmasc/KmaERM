import { GO_SERVICE_URL } from '@/constants/env.config'
import { deleteSession, getSession } from '@/lib/auth/session'

const goService = async <T = any>(url: string, options?: RequestInit, isBlob?: boolean): Promise<T> => {
  const token = await getSession()
    .then((session) => session?.accessToken)
    .catch(() => null)

  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json'
  }

  const mergedHeaders = new Headers({
    ...(options?.body instanceof FormData ? defaultHeaders : { ...defaultHeaders, 'Content-Type': 'application/json' }),
    ...(options?.headers as Record<string, string> | undefined)
  })

  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${GO_SERVICE_URL}${url}`, {
    ...options,
    headers: mergedHeaders
  })

  const data = isBlob && res.ok ? await res.blob() : await res.json().catch(() => null)

  if (!res.ok) {
    // Nếu bị 401 thì clear token và báo lỗi
    if (res.status === 401) {
      deleteSession()
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }

    throw new Error(
      (data.details && JSON.stringify(data.details).replace(/^"|"$/g, '')) ||
        data.error ||
        (data.errors && JSON.stringify(data.errors).replace(/^"|"$/g, '')) ||
        `HTTP ${res.status} ${res.statusText}`
    )
  }

  return (data ?? undefined) as T
}

export default goService
