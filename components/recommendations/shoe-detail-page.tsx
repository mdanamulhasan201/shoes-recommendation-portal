'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { fetchShoeDetails } from '@/api/shoeDetailsApi'
import { fetchGetCardQuantity, postAddToCard } from '@/api/referenceCustomerCardApi'
import {
  dispatchKioskTryonChanged,
  postAddToCardTryon
} from '@/api/referenceShoeTryonApi'
import { fetchScannerFileById } from '@/api/scannerApi'
import {
  csvDataToScanFields,
  readKioskFlowState,
  writeKioskFlowState
} from '@/app/kiosk/flow-state'
import { footWidthBandIndex } from '@/app/lib/shoeWidthBand'
import { saveWarenkorbReturnDetailPath } from '@/app/kiosk/warenkorb-return-path'
import { resolveShoeImageSrc } from '@/api/shoeImageSrc'
import {
  EMPTY_SCAN,
  type ScanState,
  type ShoeDetailData,
  type ReferenceShoeSizeRow
} from '@/components/recommendations/types'
import {
  formatEuSizeLabel,
  joinDetailList,
  sizeValueKey,
  sortReferenceSizes
} from '@/components/recommendations/shoe-detail/size-utils'
import {
  cartArticleCount,
  readCart,
  writeCart,
  type CartLine
} from '@/components/recommendations/shoe-detail/cart-storage'
import { KIOSK_SHOE_DETAIL_ACCENT } from '@/components/recommendations/shoe-detail/constants'
import { ShoeDetailError } from '@/components/recommendations/shoe-detail/ShoeDetailError'
import { ShoeDetailFeatureBlocks } from '@/components/recommendations/shoe-detail/ShoeDetailFeatureBlocks'
import { ShoeDetailGallery } from '@/components/recommendations/shoe-detail/ShoeDetailGallery'
import { ShoeDetailHeader } from '@/components/recommendations/shoe-detail/ShoeDetailHeader'
import { ShoeDetailInfoColumn } from '@/components/recommendations/shoe-detail/ShoeDetailInfoColumn'
import { ShoeDetailLightbox } from '@/components/recommendations/shoe-detail/ShoeDetailLightbox'
import { ShoeDetailProductDescription } from '@/components/recommendations/shoe-detail/ShoeDetailProductDescription'
import { ShoeDetailLoading } from '@/components/recommendations/shoe-detail/ShoeDetailLoading'

export function ShoeDetailPage ({
  shoeId,
  fileId,
  variant = 'page',
  onDismiss
}: {
  shoeId: string
  fileId: string
  /** `drawer`: embed in recommendations sidebar overlay (same content). */
  variant?: 'page' | 'drawer'
  /** Called instead of routing back when `variant === 'drawer'`. */
  onDismiss?: () => void
}) {
  const router = useRouter()
  const [detail, setDetail] = useState<ShoeDetailData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [fitRefetching, setFitRefetching] = useState(false)
  const [footScan, setFootScan] = useState<ScanState>(EMPTY_SCAN)
  const [ballRegulatorOffsetMm, setBallRegulatorOffsetMm] = useState(0)
  const [apiBallOffsetMm, setApiBallOffsetMm] = useState(0)
  const [widthAdjusting, setWidthAdjusting] = useState(false)
  const [footScanHydrated, setFootScanHydrated] = useState(false)
  const hadDetailRef = useRef(false)
  const fitFetchGenRef = useRef(0)
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [addToCartSubmitting, setAddToCartSubmitting] = useState(false)
  const [addToCartError, setAddToCartError] = useState<string | null>(null)
  const [addToFittingSubmitting, setAddToFittingSubmitting] = useState(false)
  const [addToFittingError, setAddToFittingError] = useState<string | null>(null)
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [selectedColorwayId, setSelectedColorwayId] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxZoom, setLightboxZoom] = useState(1)
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 })
  const [galleryDragDx, setGalleryDragDx] = useState(0)
  const [galleryDragging, setGalleryDragging] = useState(false)

  const galleryStageRef = useRef<HTMLDivElement | null>(null)
  const lbWheelAreaRef = useRef<HTMLDivElement | null>(null)
  const lightboxPanRef = useRef({ x: 0, y: 0 })
  const lightboxZoomRef = useRef(1)
  const galleryDragSessionRef = useRef(false)
  const galleryDragStartXRef = useRef(0)
  const lbPanDragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    ox: 0,
    oy: 0
  })

  const accentColor = KIOSK_SHOE_DETAIL_ACCENT

  const resolveCustomerId = useCallback((): string | null => {
    const pid = readKioskFlowState().profile?.id
    const s =
      pid !== undefined && pid !== null && String(pid).trim() !== ''
        ? String(pid).trim()
        : ''
    return s || null
  }, [])

  const syncCartBadgeCount = useCallback(async () => {
    const cid = resolveCustomerId()
    if (cid) {
      try {
        const n = await fetchGetCardQuantity(cid)
        setCartCount(n)
        return
      } catch {
        /* session fallback */
      }
    }
    setCartCount(cartArticleCount(readCart()))
  }, [resolveCustomerId])

  useEffect(() => {
    queueMicrotask(() => void syncCartBadgeCount())
    const onCh = () => void syncCartBadgeCount()
    window.addEventListener('kiosk-warenkorb-changed', onCh)
    return () => window.removeEventListener('kiosk-warenkorb-changed', onCh)
  }, [syncCartBadgeCount])

  useEffect(() => {
    let cancelled = false
    hadDetailRef.current = false
    queueMicrotask(() => {
      setFootScanHydrated(false)
      void (async () => {
        const flow = readKioskFlowState()
        const draft = flow.footMeasurementDraft
        const file = await fetchScannerFileById(fileId)
        if (cancelled) return

        const csvScan = file?.csvData
          ? csvDataToScanFields(file.csvData)
          : EMPTY_SCAN

        if (draft?.fileId === fileId && draft.scan) {
          setFootScan({
            left_length: draft.scan.left_length || csvScan.left_length,
            right_length: draft.scan.right_length || csvScan.right_length,
            left_width: draft.scan.left_width || csvScan.left_width,
            right_width: draft.scan.right_width || csvScan.right_width,
            left_ball: draft.scan.left_ball || csvScan.left_ball,
            right_ball: draft.scan.right_ball || csvScan.right_ball
          })
          const off = draft.ball_regulator_offset_mm ?? 0
          setBallRegulatorOffsetMm(off)
          setApiBallOffsetMm(off)
        } else {
          setFootScan(csvScan)
        }
        setFootScanHydrated(true)
      })()
    })
    return () => {
      cancelled = true
    }
  }, [fileId])

  useEffect(() => {
    if (!fileId) return
    try {
      const flow = readKioskFlowState()
      writeKioskFlowState({
        ...flow,
        footMeasurementDraft: {
          fileId,
          scan: footScan,
          ...(ballRegulatorOffsetMm !== 0
            ? { ball_regulator_offset_mm: ballRegulatorOffsetMm }
            : {})
        }
      })
    } catch {
      /* private mode / quota */
    }
  }, [fileId, footScan, ballRegulatorOffsetMm])

  useEffect(() => {
    const delayMs = widthAdjusting ? 120 : 200
    const t = window.setTimeout(
      () => setApiBallOffsetMm(ballRegulatorOffsetMm),
      delayMs
    )
    return () => window.clearTimeout(t)
  }, [ballRegulatorOffsetMm, widthAdjusting])

  const applyDetailPayload = useCallback((d: ShoeDetailData | null) => {
    setDetail(d)
    setGalleryIdx(0)
    const colorways = d?.reference_shoe_colors ?? []
    setSelectedColorwayId(colorways.length > 0 ? colorways[0]?.id ?? null : null)
    const rows = sortReferenceSizes(d?.reference_shoe_sizes ?? [])
    const identified = sizeValueKey(d?.identified_size_value)
    const byIdentified = identified
      ? rows.find(r => sizeValueKey(r.value) === identified)
      : undefined
    const byScan =
      d?.scan_match?.left_foot?.reference_shoe_size?.id != null
        ? rows.find(
            r => r.id === d.scan_match?.left_foot?.reference_shoe_size?.id
          )
        : undefined
    setSelectedSizeId(byIdentified?.id ?? byScan?.id ?? rows[0]?.id ?? null)
  }, [])

  const mergeScanMatchFromApi = useCallback((d: ShoeDetailData | null) => {
    if (!d) return
    setDetail((prev) => {
      if (!prev) return d
      return {
        ...prev,
        identified_size_value: d.identified_size_value ?? prev.identified_size_value,
        scan_match: d.scan_match ?? prev.scan_match
      }
    })
  }, [])

  useEffect(() => {
    if (!footScanHydrated) return
    const gen = ++fitFetchGenRef.current
    const isFitRefresh = hadDetailRef.current

    queueMicrotask(() => {
      if (isFitRefresh) setFitRefetching(true)
      else {
        setLoading(true)
        setError('')
      }

      void fetchShoeDetails(shoeId, fileId, {
        scan: footScan,
        ballRegulatorOffsetMm: apiBallOffsetMm
      })
        .then((json) => {
          if (gen !== fitFetchGenRef.current) return
          const d = json.data ?? null
          if (!hadDetailRef.current) {
            applyDetailPayload(d)
            hadDetailRef.current = true
          } else {
            mergeScanMatchFromApi(d)
          }
        })
        .catch((e) => {
          if (gen !== fitFetchGenRef.current) return
          if (!hadDetailRef.current) {
            setError(e instanceof Error ? e.message : 'Details nicht verfügbar.')
          }
        })
        .finally(() => {
          if (gen !== fitFetchGenRef.current) return
          setLoading(false)
          setFitRefetching(false)
        })
    })
  }, [
    shoeId,
    fileId,
    footScan,
    apiBallOffsetMm,
    footScanHydrated,
    applyDetailPayload,
    mergeScanMatchFromApi
  ])

  useEffect(() => {
    queueMicrotask(() => setAddToCartError(null))
  }, [selectedSizeId])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
    setLightboxZoom(1)
    setLightboxPan({ x: 0, y: 0 })
    lbPanDragRef.current.active = false
  }, [])

  useEffect(() => {
    lightboxPanRef.current = lightboxPan
  }, [lightboxPan])

  useEffect(() => {
    lightboxZoomRef.current = lightboxZoom
  }, [lightboxZoom])

  useEffect(() => {
    if (!lightboxOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxOpen, closeLightbox])

  const baseImageUrls = useMemo(
    () =>
      (detail?.images ?? [])
        .map(i => (i?.file ? resolveShoeImageSrc(i.file) : null))
        .filter((u): u is string => Boolean(u)),
    [detail?.images]
  )

  const colorways = useMemo(
    () => detail?.reference_shoe_colors?.filter(c => c?.id) ?? [],
    [detail?.reference_shoe_colors]
  )

  const imageUrls = useMemo(() => {
    const base = [...baseImageUrls]
    const selected = colorways.find(c => c.id === selectedColorwayId)
    const lead = selected?.image?.trim()
      ? resolveShoeImageSrc(selected.image)
      : null
    if (lead) {
      const rest = base.filter(u => u !== lead)
      return [lead, ...rest]
    }
    return base
  }, [baseImageUrls, colorways, selectedColorwayId])

  useEffect(() => {
    queueMicrotask(() => setGalleryIdx(0))
  }, [selectedColorwayId, detail?.id])

  const safeGalleryIdx = imageUrls.length
    ? ((galleryIdx % imageUrls.length) + imageUrls.length) % imageUrls.length
    : 0
  const currentImage = imageUrls[safeGalleryIdx] ?? null

  useEffect(() => {
    if (!lightboxOpen) return
    queueMicrotask(() => {
      setLightboxZoom(1)
      setLightboxPan({ x: 0, y: 0 })
    })
  }, [lightboxOpen, galleryIdx])

  useEffect(() => {
    if (lightboxZoom > 1.001) return
    queueMicrotask(() => {
      setLightboxPan({ x: 0, y: 0 })
    })
  }, [lightboxZoom])

  useEffect(() => {
    if (!lightboxOpen) return
    const el = lbWheelAreaRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const dz = -e.deltaY / 420
      setLightboxZoom(z => Math.min(4, Math.max(1, z * (1 + dz))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [lightboxOpen])

  const onLbPanPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (lightboxZoomRef.current <= 1) return
    const r = lbPanDragRef.current
    r.active = true
    r.startX = e.clientX
    r.startY = e.clientY
    r.ox = lightboxPanRef.current.x
    r.oy = lightboxPanRef.current.y
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onLbPanPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!lbPanDragRef.current.active) return
    const r = lbPanDragRef.current
    setLightboxPan({
      x: r.ox + (e.clientX - r.startX),
      y: r.oy + (e.clientY - r.startY)
    })
  }

  const endLbPan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!lbPanDragRef.current.active) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ok */
    }
    lbPanDragRef.current.active = false
  }


  const onLbPanPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    lbPanDragRef.current.active = false
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      /* ok */
    }
  }

  


  const onLbLostPointerCapture = () => {
    lbPanDragRef.current.active = false
  }

  const galleryPrev = useCallback(() => {
    setGalleryIdx(i => (imageUrls.length ? (i - 1 + imageUrls.length) % imageUrls.length : 0))
  }, [imageUrls.length])

  const galleryNext = useCallback(() => {
    setGalleryIdx(i => (imageUrls.length ? (i + 1) % imageUrls.length : 0))
  }, [imageUrls.length])

  const endGalleryDrag = useCallback(() => {
    galleryDragSessionRef.current = false
    setGalleryDragging(false)
    setGalleryDragDx(0)
  }, [])

  const onGalleryPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if ((e.target as HTMLElement).closest('button')) return
    galleryDragSessionRef.current = true
    galleryDragStartXRef.current = e.clientX
    if (imageUrls.length > 1) {
      setGalleryDragging(true)
      setGalleryDragDx(0)
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onGalleryPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!galleryDragSessionRef.current) return
    if (imageUrls.length > 1) {
      setGalleryDragDx(e.clientX - galleryDragStartXRef.current)
    }
  }

  const onGalleryPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!galleryDragSessionRef.current) return
    const dx = e.clientX - galleryDragStartXRef.current
    const w = galleryStageRef.current?.clientWidth ?? 360
    const slideTh = Math.max(56, w * 0.14)
    const tapTh = 14

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ok */
    }

    if (imageUrls.length > 1) {
      if (dx < -slideTh) galleryNext()
      else if (dx > slideTh) galleryPrev()
      else if (Math.abs(dx) < tapTh) setLightboxOpen(true)
    } else if (Math.abs(dx) < tapTh) {
      setLightboxOpen(true)
    }

    endGalleryDrag()
  }

  const onGalleryPointerCancel = () => {
    endGalleryDrag()
  }

  const sizes = useMemo(() => {
    const sorted = sortReferenceSizes(detail?.reference_shoe_sizes ?? [])
    const seen = new Set<string>()
    return sorted.filter(s => {
      const key = sizeValueKey(s.value)
      if (!key || !s.id) return false
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }) as ReferenceShoeSizeRow[]
  }, [detail])

  const parseScanMm = (raw: string): number => {
    const trimmed = String(raw ?? '').trim()
    if (!trimmed) return 0
    const num = Number(trimmed.replace(',', '.'))
    return Number.isFinite(num) ? num : 0
  }

  const leftLengthMm = parseScanMm(footScan.left_length)
  const rightLengthMm = parseScanMm(footScan.right_length)
  const leftBallMm = parseScanMm(footScan.left_ball)
  const rightBallMm = parseScanMm(footScan.right_ball)

  const scanMatch = detail?.scan_match
  const apiLeftP = scanMatch?.left_foot?.percent ?? 0
  const apiRightP = scanMatch?.right_foot?.percent ?? 0
  const apiConfidence = scanMatch?.confidence_percent ?? 0

  const fitScorePending =
    fitRefetching || Math.abs(ballRegulatorOffsetMm - apiBallOffsetMm) > 0.05

  const leftP = apiLeftP
  const rightP = apiRightP
  const confidence = apiConfidence
  const fitSliderPct = Math.max(0, Math.min(100, (leftP + rightP) / 2))

  const regulatorBallMm = useMemo(() => {
    const lIdx =
      footWidthBandIndex(leftBallMm, leftLengthMm, ballRegulatorOffsetMm) ?? 0
    const rIdx =
      footWidthBandIndex(rightBallMm, rightLengthMm, ballRegulatorOffsetMm) ??
      0
    return rIdx > lIdx ? rightBallMm : leftBallMm
  }, [
    leftBallMm,
    leftLengthMm,
    rightBallMm,
    rightLengthMm,
    ballRegulatorOffsetMm
  ])

  const regulatorLengthMm = useMemo(() => {
    const lIdx =
      footWidthBandIndex(leftBallMm, leftLengthMm, ballRegulatorOffsetMm) ?? 0
    const rIdx =
      footWidthBandIndex(rightBallMm, rightLengthMm, ballRegulatorOffsetMm) ??
      0
    return rIdx > lIdx ? rightLengthMm : leftLengthMm
  }, [
    leftBallMm,
    leftLengthMm,
    rightBallMm,
    rightLengthMm,
    ballRegulatorOffsetMm
  ])

  const categoryLine = useMemo(() => {
    if (!detail) return ''
    const t = detail.category?.name ?? detail.shoe_type ?? ''
    return t.replace(/_/g, ' ').toUpperCase()
  }, [detail])

  const characteristics = useMemo(
    () => detail?.reference_shoe_characteristics?.filter(Boolean) ?? [],
    [detail?.reference_shoe_characteristics]
  )

  const pushRecommendations = useCallback(() => {
    if (variant === 'drawer' && onDismiss) {
      onDismiss()
      return
    }
    router.push('/kiosk/recommendations')
  }, [router, variant, onDismiss])

  const openWarenkorb = useCallback(() => {
    saveWarenkorbReturnDetailPath(shoeId, fileId)
    router.push('/kiosk/warenkorb')
  }, [router, shoeId, fileId])

  const addToCart = useCallback(async () => {
    if (!detail) return

    const sizeRow = (detail.reference_shoe_sizes ?? []).find(
      r => r.id && r.id === selectedSizeId
    )
    if (!sizeRow?.id) {
      setAddToCartError('Bitte eine Größe wählen.')
      return
    }

    const colorwaysList = (detail.reference_shoe_colors ?? []).filter(c => c?.id)
    const selectedColor = colorwaysList.find(c => c.id === selectedColorwayId)
    if (colorwaysList.length > 0 && !selectedColor?.id) {
      setAddToCartError('Bitte eine Farbe wählen.')
      return
    }

    const flow = readKioskFlowState()
    const pid = flow.profile?.id
    const customerId =
      pid !== undefined && pid !== null && String(pid).trim() !== ''
        ? String(pid).trim()
        : ''
    if (!customerId) {
      setAddToCartError(
        'Kein Kundenprofil — bitte den Kiosk-Flow vom Start durchlaufen.'
      )
      return
    }

    setAddToCartError(null)
    setAddToCartSubmitting(true)
    try {
      const addResp = await postAddToCard({
        customerId,
        type: 'admin_stock',
        reference_shoe_size_id: sizeRow.id,
        ...(selectedColor?.id
          ? { reference_shoe_color_id: selectedColor.id }
          : {}),
        quantity: 1
      })
      const serverCardId =
        addResp.data?.id && String(addResp.data.id).trim()
          ? String(addResp.data.id).trim()
          : undefined

      const lines = readCart()
      const sid = sizeRow.id
      const cid = selectedColor?.id ?? null
      const idx = lines.findIndex(l => {
        const sameSize =
          (l.referenceShoeSizeId && l.referenceShoeSizeId === sid) ||
          (!l.referenceShoeSizeId &&
            l.shoeId === detail.id &&
            sizeValueKey(l.size) === sizeValueKey(sizeRow.value))
        if (!sameSize) return false
        const lineColorId = l.referenceShoeColorId ?? null
        return lineColorId === cid
      })
      const tagline =
        detail.mission?.trim() ||
        joinDetailList(detail.running_style) ||
        detail.shoe_type?.replace(/_/g, ' ') ||
        null
      const colorLabel = selectedColor?.name?.trim() || null

      if (idx >= 0) {
        const prev = lines[idx]
        lines[idx] = {
          ...prev,
          ...(serverCardId ? { cardId: serverCardId } : {}),
          referenceShoeSizeId: sid,
          referenceShoeColorId: cid,
          color: colorLabel ?? prev.color,
          quantity: Math.min(999, prev.quantity + 1),
          image: currentImage ?? prev.image,
          price: detail.prise ?? prev.price,
          name: detail.name ?? detail.sku ?? prev.name,
          size: sizeRow.value ?? prev.size,
          tagline: tagline ?? prev.tagline
        }
      } else {
        const nextLine: CartLine = {
          ...(serverCardId ? { cardId: serverCardId } : {}),
          shoeId: detail.id,
          name: detail.name ?? detail.sku ?? 'Schuh',
          image: currentImage,
          price: detail.prise ?? '',
          size: sizeRow.value,
          color: colorLabel,
          referenceShoeSizeId: sid,
          referenceShoeColorId: cid,
          quantity: 1,
          tagline
        }
        lines.push(nextLine)
      }
      writeCart(lines)
      await syncCartBadgeCount()

      const displayName = (detail.name ?? detail.sku ?? 'Artikel').trim()
      const euLabel = formatEuSizeLabel(sizeRow.value)
      const toastParts = [displayName, euLabel, colorLabel].filter(Boolean)
      toast.success('Im Warenkorb', {
        description: toastParts.join(' · '),
        id: 'kiosk-add-cart',
        duration: 3200
      })
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Warenkorb konnte nicht aktualisiert werden.'
      setAddToCartError(msg)
      toast.error(msg, { id: 'kiosk-add-cart-err', duration: 4500 })
    } finally {
      setAddToCartSubmitting(false)
    }
  }, [detail, currentImage, selectedSizeId, selectedColorwayId, syncCartBadgeCount])

  const addToFitting = useCallback(async () => {
    if (!detail) return

    const sizeRow = (detail.reference_shoe_sizes ?? []).find(
      r => r.id && r.id === selectedSizeId
    )
    if (!sizeRow?.id) {
      setAddToFittingError('Bitte eine Größe wählen.')
      return
    }

    const colorwaysList = (detail.reference_shoe_colors ?? []).filter(c => c?.id)
    const selectedColor = colorwaysList.find(c => c.id === selectedColorwayId)
    if (colorwaysList.length > 0 && !selectedColor?.id) {
      setAddToFittingError('Bitte eine Farbe wählen.')
      return
    }

    const customerId = resolveCustomerId()
    if (!customerId) {
      setAddToFittingError(
        'Kein Kundenprofil — bitte den Kiosk-Flow vom Start durchlaufen.'
      )
      return
    }

    const priceRaw = Number(
      String(detail.prise ?? '')
        .trim()
        .replace(',', '.')
    )
    const sizeValue =
      sizeRow.value !== null && sizeRow.value !== undefined
        ? String(sizeRow.value).trim()
        : ''

    setAddToFittingError(null)
    setAddToFittingSubmitting(true)
    try {
      await postAddToCardTryon(customerId, {
        reference_shoe_id: detail.id,
        reference_shoe_size_id: sizeRow.id,
        ...(sizeValue ? { size_value: sizeValue } : {}),
        ...(sizeRow.table_name?.trim()
          ? { table_name: sizeRow.table_name.trim() }
          : {}),
        ...(typeof sizeRow.insoleMinMm === 'number'
          ? { insoleMinMm: sizeRow.insoleMinMm }
          : {}),
        ...(typeof sizeRow.insoleMaxMm === 'number'
          ? { insoleMaxMm: sizeRow.insoleMaxMm }
          : {}),
        ...(selectedColor?.name?.trim()
          ? { color_name: selectedColor.name.trim() }
          : {}),
        ...(selectedColor?.code?.trim()
          ? { color_code: selectedColor.code.trim() }
          : {}),
        ...(selectedColor?.id
          ? { reference_shoe_color_id: selectedColor.id }
          : {}),
        quantity: 1,
        ...(Number.isFinite(priceRaw) ? { price: priceRaw } : {}),
        try_on_type: 'admin_stock',
        left_foot_percentage: Math.round(leftP),
        right_foot_percentage: Math.round(rightP),
        ...(fileId.trim() ? { scan_id: fileId.trim() } : {}),
        note: 'Kiosk try-on'
      })

      dispatchKioskTryonChanged()

      const displayName = (detail.name ?? detail.sku ?? 'Modell').trim()
      const euLabel = formatEuSizeLabel(sizeRow.value)
      const colorLabel = selectedColor?.name?.trim() || null
      toast.success('Zur Anprobe hinzugefügt', {
        description: [displayName, euLabel, colorLabel].filter(Boolean).join(' · '),
        id: 'kiosk-tryon-add',
        duration: 3200
      })
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : 'Anprobe konnte nicht aktualisiert werden.'
      setAddToFittingError(msg)
      toast.error(msg, { id: 'kiosk-tryon-add-err', duration: 4500 })
    } finally {
      setAddToFittingSubmitting(false)
    }
  }, [
    detail,
    selectedSizeId,
    selectedColorwayId,
    resolveCustomerId,
    leftP,
    rightP,
    fileId
  ])

  if (loading) {
    if (variant === 'drawer') {
      return (
        <div className='flex min-h-0 flex-1 items-center justify-center bg-[#050505] p-8'>
          <ShoeDetailLoading />
        </div>
      )
    }
    return <ShoeDetailLoading />
  }

  if (error || !detail) {
    return (
      <div
        className={
          variant === 'drawer'
            ? 'flex min-h-0 flex-1 flex-col bg-[#050505]'
            : undefined
        }
      >
        <ShoeDetailError
          message={error || 'Keine Daten.'}
          onBackToSelection={pushRecommendations}
        />
      </div>
    )
  }

  const perfectEuLabel = formatEuSizeLabel(
    detail.identified_size_value ?? scanMatch?.left_foot?.value
  )
  const leftFootSizeLabel = `L: ${formatEuSizeLabel(scanMatch?.left_foot?.value)}`
  const rightFootSizeLabel = `R: ${formatEuSizeLabel(scanMatch?.right_foot?.value)}`

  const applyPerfectSize = () => {
    const identified = sizeValueKey(detail.identified_size_value)
    const row = identified
      ? sizes.find(r => sizeValueKey(r.value) === identified)
      : sizes.find(r => r.id === scanMatch?.left_foot?.reference_shoe_size?.id)
    if (row?.id) setSelectedSizeId(row.id)
  }

  const isDrawer = variant === 'drawer'

  return (
    <div
      className={
        isDrawer
          ? 'relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#050505] text-white'
          : 'relative min-h-dvh w-full overflow-x-hidden bg-[#050505] text-white'
      }
    >
      {!isDrawer ? (
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.06)_0%,transparent_50%)]' />
      ) : null}

      <div className={isDrawer ? 'shrink-0 border-b border-white/10' : undefined}>
        <ShoeDetailHeader
          onBack={pushRecommendations}
          onWarenkorbClick={openWarenkorb}
          cartCount={cartCount}
        />
      </div>

      <div
        className={
          isDrawer
            ? 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain'
            : undefined
        }
      >
        <div
          className={
            isDrawer
              ? 'relative z-10 mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pb-10 pt-4 sm:px-6'
              : 'relative z-10 mt-10 mx-auto grid max-w-[1480px] gap-6 px-4 pb-12 sm:gap-8 sm:px-8 lg:grid-cols-[minmax(0,52%)_1fr] lg:items-start lg:gap-10'
          }
        >
          <div
            className={
              isDrawer
                ? 'flex w-full min-w-0 flex-col'
                : 'flex w-full min-w-0 flex-col lg:sticky lg:top-[4.75rem] lg:self-start'
            }
          >
            <ShoeDetailGallery
              galleryStageRef={galleryStageRef}
              imageUrls={imageUrls}
              currentImage={currentImage}
              safeGalleryIdx={safeGalleryIdx}
              setGalleryIdx={setGalleryIdx}
              galleryDragDx={galleryDragDx}
              galleryDragging={galleryDragging}
              activeColor={accentColor}
              detailName={detail.name}
              colorways={colorways}
              selectedColorwayId={selectedColorwayId}
              onSelectColorway={setSelectedColorwayId}
              onPointerDown={onGalleryPointerDown}
              onPointerMove={onGalleryPointerMove}
              onPointerUp={onGalleryPointerUp}
              onPointerCancel={onGalleryPointerCancel}
              onGalleryPrev={galleryPrev}
              onGalleryNext={galleryNext}
            />
          </div>

          <ShoeDetailInfoColumn
            detail={detail}
            categoryLine={categoryLine}
            accentColor={accentColor}
            sizes={sizes}
            selectedSizeId={selectedSizeId}
            onSelectSizeId={setSelectedSizeId}
            perfectEuLabel={perfectEuLabel}
            onApplyPerfectSize={applyPerfectSize}
            leftFootPercent={leftP}
            rightFootPercent={rightP}
            leftFootSizeLabel={leftFootSizeLabel}
            rightFootSizeLabel={rightFootSizeLabel}
            confidencePercent={confidence}
            fitSliderPercent={fitSliderPct}
            regulatorBallMm={regulatorBallMm}
            regulatorLengthMm={regulatorLengthMm}
            ballRegulatorOffsetMm={ballRegulatorOffsetMm}
            onBallRegulatorOffsetChange={setBallRegulatorOffsetMm}
            onWidthAdjustingChange={setWidthAdjusting}
            fitRefetching={fitRefetching}
            fitScorePending={fitScorePending}
            addToCartSubmitting={addToCartSubmitting}
            addToCartError={addToCartError}
            onAddToCart={addToCart}
            addToFittingSubmitting={addToFittingSubmitting}
            addToFittingError={addToFittingError}
            onAddToFitting={addToFitting}
            onBackToSelection={pushRecommendations}
          />
        </div>

        <div
          className={
            isDrawer
              ? 'relative z-10 mx-auto w-full max-w-[720px] px-4 pb-10 sm:px-6'
              : 'relative z-10 mx-auto w-full max-w-[1480px] px-4 pb-14 sm:px-8'
          }
        >
          <ShoeDetailFeatureBlocks
            items={characteristics}
            accentColor={accentColor}
            compact={isDrawer}
          />
        </div>

        <div
          className={
            isDrawer
              ? 'relative z-10 mx-auto w-full max-w-[720px] px-4 pb-14 sm:px-6'
              : 'relative z-10 mx-auto w-full max-w-[1480px] px-4 pb-16 sm:px-8'
          }
        >
          <ShoeDetailProductDescription
            productDescription={detail.product_description}
          />
        </div>
      </div>

      <ShoeDetailLightbox
        open={lightboxOpen}
        imageUrls={imageUrls}
        safeGalleryIdx={safeGalleryIdx}
        setGalleryIdx={setGalleryIdx}
        productName={detail.name}
        accentColor={accentColor}
        lightboxZoom={lightboxZoom}
        setLightboxZoom={setLightboxZoom}
        lightboxPan={lightboxPan}
        setLightboxPan={setLightboxPan}
        lbWheelAreaRef={lbWheelAreaRef}
        closeLightbox={closeLightbox}
        onLbPanPointerDown={onLbPanPointerDown}
        onLbPanPointerMove={onLbPanPointerMove}
        endLbPan={endLbPan}
        onLbPanPointerCancel={onLbPanPointerCancel}
        onLbLostPointerCapture={onLbLostPointerCapture}
      />
    </div>
  )
}
