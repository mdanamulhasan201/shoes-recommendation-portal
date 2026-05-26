'use client'

import { Suspense, type ReactNode } from 'react'
import { AuthGate } from './AuthGate'
import { PartnerFeatureAccessProvider } from './PartnerFeatureAccessProvider'
import { ScannerAuthProvider } from './ScannerAuthProvider'

export function AppAuthShell ({ children }: { children: ReactNode }) {
  return (
    <ScannerAuthProvider>
      <PartnerFeatureAccessProvider>
        <Suspense fallback={null}>
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </PartnerFeatureAccessProvider>
    </ScannerAuthProvider>
  )
}
