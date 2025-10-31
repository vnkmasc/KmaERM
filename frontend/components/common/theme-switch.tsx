'use client'

import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from 'lucide-react'

const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className='flex w-full items-center justify-between'
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      Giao diện
      {theme === 'light' ? <SunIcon className='h-4 w-4' /> : <MoonIcon className='h-4 w-4' />}
    </div>
  )
}

export default ThemeSwitch
