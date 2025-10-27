'use client'

import { useState, useEffect } from 'react'

const breakpoints = {
  sm: '(min-width: 40rem)', // 640px
  md: '(min-width: 48rem)', // 768px
  lg: '(min-width: 64rem)', // 1024px
  xl: '(min-width: 80rem)', // 1280px
  '2xl': '(min-width: 96rem)' // 1536px
}

export default function UseBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<{
    sm: boolean
    md: boolean
    lg: boolean
    xl: boolean
    '2xl': boolean
  }>({
    sm: false,
    md: false,
    lg: false,
    xl: false,
    '2xl': false
  })

  useEffect(() => {
    const calculateBreakpoint = () => {
      const newBreakpoint = {
        sm: window.matchMedia(breakpoints.sm).matches,
        md: window.matchMedia(breakpoints.md).matches,
        lg: window.matchMedia(breakpoints.lg).matches,
        xl: window.matchMedia(breakpoints.xl).matches,
        '2xl': window.matchMedia(breakpoints['2xl']).matches
      }

      setBreakpoint((prev) => {
        const isSame = Object.keys(newBreakpoint).every(
          (key) => newBreakpoint[key as keyof typeof newBreakpoint] === prev[key as keyof typeof prev]
        )
        return isSame ? prev : newBreakpoint
      })
    }

    calculateBreakpoint()

    const handleResize = () => {
      calculateBreakpoint()
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return breakpoint
}
