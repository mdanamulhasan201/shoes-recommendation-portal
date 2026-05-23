'use client'

import type { ReactNode } from 'react'
import { AuthGate } from './AuthGate'
import { ScannerAuthProvider } from './ScannerAuthProvider'

export function AppAuthShell ({ children }: { children: ReactNode }) {
  return (
    <ScannerAuthProvider>
      <AuthGate>{children}</AuthGate>
    </ScannerAuthProvider>
  )
}
