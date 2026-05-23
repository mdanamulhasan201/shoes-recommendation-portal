'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ScannerAppHeader } from './ScannerAppHeader'
import { useScannerAuth } from './ScannerAuthProvider'

const PUBLIC_PATH_PREFIXES = ['/login', '/api/']

function isPublicPath (pathname: string): boolean {
  if (!pathname) return false
  return PUBLIC_PATH_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(prefix)
  )
}

function loginPathForReturnTo (pathname: string): string {
  const path = pathname || '/'
  if (path === '/' || path === '/login') return '/login'
  return `/login?redirect=${encodeURIComponent(path)}`
}

/**
 * Protected routes render only after auth bootstrap finishes and session is valid.
 * No token → never show app routes; redirect to /login.
 */
export function AuthGate ({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const router = useRouter()
  const { bootstrapped, status } = useScannerAuth()
  const isPublic = isPublicPath(pathname)
  const postLoginRedirectRef = useRef(false)

  useEffect(() => {
    if (!bootstrapped || isPublic) return
    if (status === 'authenticated') return
    router.replace(loginPathForReturnTo(pathname))
  }, [bootstrapped, isPublic, pathname, router, status])

  useEffect(() => {
    if (pathname !== '/login') {
      postLoginRedirectRef.current = false
      return
    }
    if (!bootstrapped || status !== 'authenticated' || postLoginRedirectRef.current) {
      return
    }

    postLoginRedirectRef.current = true
    const target = searchParams.get('redirect')
    const safe =
      target && target.startsWith('/') && !target.startsWith('/login')
        ? target
        : '/'
    router.replace(safe)
  }, [bootstrapped, pathname, router, searchParams, status])

  if (pathname === '/login' || pathname.startsWith('/api/')) {
    return <>{children}</>
  }

  if (!bootstrapped || status === 'loading' || status === 'unauthenticated') {
    return null
  }

  return (
    <>
      <ScannerAppHeader />
      {children}
    </>
  )
}
