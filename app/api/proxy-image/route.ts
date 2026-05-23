import { NextRequest, NextResponse } from 'next/server'
import { isAllowedProxyImageUrl } from './allowedHosts'

const MAX_BATCH_URLS = 32
const UPSTREAM_REVALIDATE_SEC = 86_400

function upstreamImageFetchInit (): RequestInit {
  return {
    redirect: 'follow' as RequestRedirect,
    cache: 'force-cache',
    next: { revalidate: UPSTREAM_REVALIDATE_SEC }
  }
}

function contentTypeFromUpstream (rawCt: string): string {
  if (rawCt.startsWith('image/')) return rawCt.split(';')[0].trim()
  if (rawCt === 'application/octet-stream') return 'image/png'
  return 'image/png'
}

async function fetchAllowedImage (
  url: string
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  try {
    const upstream = await fetch(url, upstreamImageFetchInit())
    if (!upstream.ok) return null
    const contentType = contentTypeFromUpstream(
      upstream.headers.get('content-type') ?? ''
    )
    const buffer = await upstream.arrayBuffer()
    return { buffer, contentType }
  } catch {
    return null
  }
}

/** GET ?url=… → image bytes (PDF / CORS-safe S3). Backend API uses axios + `.env`, not this route. */
export async function GET (req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')
  if (!raw || !isAllowedProxyImageUrl(raw)) {
    return NextResponse.json({ message: 'Invalid or disallowed URL' }, { status: 400 })
  }

  const image = await fetchAllowedImage(raw)
  if (!image) {
    return NextResponse.json({ message: 'Fetch failed' }, { status: 502 })
  }

  return new NextResponse(image.buffer, {
    status: 200,
    headers: {
      'Content-Type': image.contentType,
      'Cache-Control': 'private, max-age=120'
    }
  })
}

/** POST `{ urls: string[] }` → `{ results: (string|null)[] }` data URLs (recommendations PDF). */
export async function POST (req: NextRequest) {
  let body: { urls?: unknown }
  try {
    body = (await req.json()) as { urls?: unknown }
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const urls = Array.isArray(body.urls)
    ? body.urls.filter((u): u is string => typeof u === 'string')
    : []

  if (urls.length === 0) return NextResponse.json({ results: [] })
  if (urls.length > MAX_BATCH_URLS) {
    return NextResponse.json(
      { message: `At most ${MAX_BATCH_URLS} images` },
      { status: 400 }
    )
  }

  for (const u of urls) {
    if (!isAllowedProxyImageUrl(u)) {
      return NextResponse.json({ message: 'Disallowed URL' }, { status: 400 })
    }
  }

  const results = await Promise.all(
    urls.map(async u => {
      const image = await fetchAllowedImage(u)
      if (!image) return null
      const b64 = Buffer.from(image.buffer).toString('base64')
      return `data:${image.contentType};base64,${b64}`
    })
  )

  return NextResponse.json({ results })
}
