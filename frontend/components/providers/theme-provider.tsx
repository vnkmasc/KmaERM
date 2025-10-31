import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
      storageKey='theme'
    >
      {children}
    </NextThemesProvider>
  )
}
