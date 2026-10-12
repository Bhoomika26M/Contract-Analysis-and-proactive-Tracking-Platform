import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Theme } from '../theme'
import { LIGHT, DARK } from '../theme'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: LIGHT,
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)

  return (
    <ThemeContext.Provider value={{ theme: isDark ? DARK : LIGHT, toggleTheme: () => setIsDark(p => !p) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
