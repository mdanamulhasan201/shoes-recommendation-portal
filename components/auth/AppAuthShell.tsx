'use client'

import type { ReactNode } from 'react'
import { AuthGate } from './AuthGate'
import { PartnerFeatureAccessProvider } from './PartnerFeatureAccessProvider'
import { ScannerAuthProvider } from './ScannerAuthProvider'

export function AppAuthShell ({ children }: { children: ReactNode }) {
  return (
    <ScannerAuthProvider>
      <PartnerFeatureAccessProvider>
        <AuthGate>{children}</AuthGate>
      </PartnerFeatureAccessProvider>
    </ScannerAuthProvider>
  )
}
