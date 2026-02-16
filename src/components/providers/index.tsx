'use client'

import { ThemeProvider } from './theme-provider'
import { AuthProvider } from '@/lib/auth/context'
import { OrganizationProvider } from '@/lib/auth/organization'
import { Toaster } from '@/components/ui/toast'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OrganizationProvider>
          {children}
          <Toaster />
        </OrganizationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
