'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { checkAuth } from '@/api/foot-scanners/checkAuth'
import type { FootScannerSession } from '@/api/foot-scanners/footScannerTypes'
import { loginFootScanner } from '@/api/foot-scanners/loginFootScanner'
import {
  clearFootScannerToken,
  readStoredFootScannerToken,
  storeFootScannerToken
} from '@/api/foot-scanners/scannerAuthToken'
import { clearBuyCreditsAccess } from '@/app/lib/buyCreditsAccess'
import { disconnectSocket, initSocket } from '@/app/lib/socket'

export type ScannerAuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type ScannerAuthContextValue = {
  bootstrapped: boolean
  status: ScannerAuthStatus
  session: FootScannerSession | null
  login: (scannerId: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const ScannerAuthContext = createContext<ScannerAuthContextValue | null>(null)

export function ScannerAuthProvider ({ children }: { children: ReactNode }) {
  const [bootstrapped, setBootstrapped] = useState(false)
  const [status, setStatus] = useState<ScannerAuthStatus>('loading')
  const [session, setSession] = useState<FootScannerSession | null>(null)
  const verifyGeneration = useRef(0)

  const setAuthenticated = useCallback((data: FootScannerSession) => {
    setSession(data)
    setStatus('authenticated')
    initSocket(data.id)
  }, [])

  const setUnauthenticated = useCallback(() => {
    disconnectSocket()
    setSession(null)
    setStatus('unauthenticated')
  }, [])

  const verifyStoredSession = useCallback(async () => {
    const gen = ++verifyGeneration.current
    setStatus('loading')

    const token = readStoredFootScannerToken()
    if (!token) {
      if (gen === verifyGeneration.current) setUnauthenticated()
      return
    }

    const result = await checkAuth()
    if (gen !== verifyGeneration.current) return

    if (result.ok) {
      setAuthenticated(result.session)
      return
    }

    setUnauthenticated()
  }, [setAuthenticated, setUnauthenticated])

  useEffect(() => {
    void verifyStoredSession().finally(() => {
      setBootstrapped(true)
    })
  }, [verifyStoredSession])

  const login = useCallback(
    async (scannerId: string, password: string) => {
      setStatus('loading')
      const { token, scanner } = await loginFootScanner({ scannerId, password })
      storeFootScannerToken(token)

      verifyGeneration.current += 1
      const gen = ++verifyGeneration.current
      const result = await checkAuth()
      if (gen !== verifyGeneration.current) return

      if (result.ok) {
        setAuthenticated(result.session)
      } else {
        setAuthenticated(scanner)
      }
      setBootstrapped(true)
    },
    [setAuthenticated]
  )

  const logout = useCallback(() => {
    verifyGeneration.current += 1
    clearFootScannerToken()
    clearBuyCreditsAccess()
    setUnauthenticated()
    setBootstrapped(true)
  }, [setUnauthenticated])

  const refresh = useCallback(async () => {
    setBootstrapped(false)
    await verifyStoredSession()
    setBootstrapped(true)
  }, [verifyStoredSession])

  const value = useMemo(
    () => ({ bootstrapped, status, session, login, logout, refresh }),
    [bootstrapped, status, session, login, logout, refresh]
  )

  return (
    <ScannerAuthContext.Provider value={value}>
      {children}
    </ScannerAuthContext.Provider>
  )
}

export function useScannerAuth (): ScannerAuthContextValue {
  const ctx = useContext(ScannerAuthContext)
  if (!ctx) {
    throw new Error('useScannerAuth must be used within ScannerAuthProvider')
  }
  return ctx
}
