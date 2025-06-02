'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {}
})

export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ 
  children, 
  defaultTheme = 'dark',
  storageKey = 'career-scout-theme',
  ...props 
}) {
  const [theme, setTheme] = useState(defaultTheme)
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }
  
  // Context value
  const value = {
    theme,
    setTheme,
    toggleTheme
  }
  
  return (
    <ThemeContext.Provider value={value}>
      <NextThemesProvider
        {...props}
        defaultTheme={defaultTheme}
        attribute="class"
        enableSystem
        disableTransitionOnChange
        storageKey={storageKey}
      >
        {children}
      </NextThemesProvider>
    </ThemeContext.Provider>
  )
} 