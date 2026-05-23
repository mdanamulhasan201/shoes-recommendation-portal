'use client'

import { useParams } from 'next/navigation'
import { ShoeDetailPage } from '@/components/recommendations/shoe-detail-page'

export default function KioskShoeDetailRoute () {
  const p = useParams()
  const shoeId = typeof p?.shoeId === 'string' ? p.shoeId : ''
  const fileId = typeof p?.fileId === 'string' ? p.fileId : ''

  if (!shoeId || !fileId) {
    return (
      <div className='flex min-h-dvh items-center justify-center bg-[#050505] text-white/60'>
        Ungültige Adresse.
      </div>
    )
  }

  return <ShoeDetailPage shoeId={shoeId} fileId={fileId} />
}
