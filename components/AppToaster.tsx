'use client'

import { Toaster } from 'sonner'

export function AppToaster () {
  return (
    <Toaster
      theme='dark'
      position='top-center'
      offset={{ top: 'max(12px, env(safe-area-inset-top, 0px))' }}
      richColors
      closeButton
      duration={2800}
      toastOptions={{
        className: 'font-sans',
        style: {
          background: 'rgba(20, 24, 32, 0.96)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.95)'
        }
      }}
    />
  )
}
