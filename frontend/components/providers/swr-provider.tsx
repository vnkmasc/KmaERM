'use client'

import { SWRConfig } from 'swr'

const SwrProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SWRConfig
      value={{
        loadingTimeout: 5000,
        shouldRetryOnError: false,
        revalidateOnFocus: false
      }}
    >
      {children}
    </SWRConfig>
  )
}

export default SwrProvider
