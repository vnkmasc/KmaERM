export const saveDataStorage = (key: string, data: any, type: 'local' | 'session' = 'local') => {
  if (typeof window === 'undefined') return

  const storage = type === 'session' ? window.sessionStorage : window.localStorage

  if (Array.isArray(data) || typeof data === 'object') {
    storage.setItem(key, JSON.stringify(data))
  } else if (data === null || data === undefined) {
    console.log('No data to save into storage')
    return
  } else {
    storage.setItem(key, data)
  }
}

export const getDataStorage = (key: string, type: 'local' | 'session' = 'local') => {
  if (typeof window === 'undefined') return null

  const storage = type === 'session' ? window.sessionStorage : window.localStorage

  const dataStorage = storage.getItem(key)
  if (dataStorage === null) {
    return null
  } else {
    try {
      return JSON.parse(dataStorage)
    } catch {
      return dataStorage
    }
  }
}

export const removeDataStorage = (key: string, type: 'local' | 'session' = 'local') => {
  if (typeof window === 'undefined') return

  const storage = type === 'session' ? window.sessionStorage : window.localStorage
  storage.removeItem(key)
}
