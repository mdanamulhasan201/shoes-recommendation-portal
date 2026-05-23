'use client'

import { apiUrl } from '@/api/apiConfig'
import { axiosClient } from '@/app/api/client/axiosClient'
import { readStoredFootScannerToken } from '@/api/foot-scanners/scannerAuthToken'

/* ------------------------------------------------------------------------- */
/*  API types                                                                */
/* ------------------------------------------------------------------------- */

export type PdfRecommendation = {
  name: string | null
  subtitle: string | null
  price: string | null
  image: string | null
  leftPercent: number | null
  rightPercent: number | null
}

export type PdfData = {
  user_info: { id: string; name: string | null; gender: string | null } | null
  recommendations: PdfRecommendation[]
  fussscans: {
    leftFootImage: string | null
    rightFootImage: string | null
  } | null
}

type RawPdfApiResponse = {
  success?: boolean
  message?: string
  data?: {
    'user info'?: PdfData['user_info']
    user_info?: PdfData['user_info']
    recommendations?: PdfRecommendation[]
    fussscans?: PdfData['fussscans']
  }
  error?: string
}

/* ------------------------------------------------------------------------- */
/*  Fetch                                                                    */
/* ------------------------------------------------------------------------- */

export async function fetchRecommendationPdfData (
  scannerId: string
): Promise<PdfData> {
  if (!scannerId) throw new Error('Scanner-ID fehlt.')

  const path = `/v3/reference-shoe/shoe-recommendation/get-pdf-data/${encodeURIComponent(scannerId)}`

  const json = readStoredFootScannerToken()
    ? (await axiosClient.get<RawPdfApiResponse>(path)).data
    : (await fetch(apiUrl(path), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...((process.env.NEXT_PUBLIC_API_TOKEN ?? '').trim()
            ? { Token: (process.env.NEXT_PUBLIC_API_TOKEN ?? '').trim() }
            : {})
        },
        cache: 'no-store'
      }).then(r => r.json())) as RawPdfApiResponse

  if (json.success === false) {
    throw new Error(json.message || 'Request failed')
  }

  // The API uses the key "user info" with a space — normalise it.
  const data = json.data ?? {}
  return {
    user_info: data.user_info ?? data['user info'] ?? null,
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    fussscans: data.fussscans ?? null
  }
}

/* ------------------------------------------------------------------------- */
/*  Same-origin proxy: S3 has no CORS for localhost → html2canvas drops images */
/* ------------------------------------------------------------------------- */

async function fetchProxyImagesAsData (
  urls: string[]
): Promise<(string | null)[]> {
  if (urls.length === 0) return []
  const res = await fetch(`${window.location.origin}/api/proxy-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls })
  })
  if (!res.ok) {
    throw new Error('Bilder für PDF konnten nicht geladen werden.')
  }
  const json = (await res.json()) as { results?: unknown }
  const rows = Array.isArray(json.results) ? json.results : []
  return urls.map((_, i) =>
    typeof rows[i] === 'string' ? (rows[i] as string) : null
  )
}

/** Collect unique HTTPS URLs → one `POST /api/proxy-image` (parallel server fetch). */
export async function hydratePdfDataImages (data: PdfData): Promise<PdfData> {
  const toFetch: string[] = []
  const push = (u: string | null | undefined): void => {
    const s = u?.trim()
    if (!s || s.startsWith('data:') || !/^https?:\/\//i.test(s)) return
    if (!toFetch.includes(s)) toFetch.push(s)
  }

  for (const r of data.recommendations) push(r.image)
  if (data.fussscans) {
    push(data.fussscans.leftFootImage)
    push(data.fussscans.rightFootImage)
  }

  const fetched = await fetchProxyImagesAsData(toFetch)
  const urlToData = new Map<string, string | null>()
  toFetch.forEach((u, i) => urlToData.set(u, fetched[i] ?? null))

  const resolve = (url: string | null | undefined): string | null => {
    const s = url?.trim()
    if (!s) return null
    if (s.startsWith('data:')) return s
    if (!/^https?:\/\//i.test(s)) return s
    return urlToData.get(s) ?? null
  }

  const recs = data.recommendations.map(r => ({
    ...r,
    image: resolve(r.image)
  }))

  let fuss = data.fussscans
  if (fuss) {
    fuss = {
      leftFootImage: resolve(fuss.leftFootImage),
      rightFootImage: resolve(fuss.rightFootImage)
    }
  }

  return { ...data, recommendations: recs, fussscans: fuss }
}

/* ------------------------------------------------------------------------- */
/*  HTML report (matches the dark "Hallo {name}!" mockup)                    */
/* ------------------------------------------------------------------------- */

const escapeHtml = (raw: string | null | undefined): string => {
  if (raw === null || raw === undefined) return ''
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const firstName = (full: string | null | undefined): string => {
  if (!full) return 'Kunde'
  const trimmed = full.trim()
  if (!trimmed) return 'Kunde'
  const first = trimmed.split(/\s+/)[0]
  return first.charAt(0).toUpperCase() + first.slice(1)
}

/**
 * Build a safe, readable filename token from an arbitrary user name.
 * `"a b"` → `"a_b"`, `"Tariq Khan"` → `"Tariq_Khan"`.
 * Falls back to `"Kunde"` if nothing usable remains.
 */
const filenameFromName = (full: string | null | undefined): string => {
  if (!full) return 'Kunde'
  const cleaned = String(full)
    .normalize('NFKD')
    // Replace any character that is not a letter, digit, underscore or dash
    // with a single underscore. Uses unicode property escapes so accented
    // German names (ä, ö, ü, ß) are preserved.
    .replace(/[^\p{L}\p{N}_-]+/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  return cleaned || 'Kunde'
}

export const buildPdfFilename = (full: string | null | undefined): string =>
  `FeetF1rst_Empfehlung_${filenameFromName(full)}`

const renderRecommendationCard = (rec: PdfRecommendation): string => {
  const name = escapeHtml(rec.name || 'Schuh')
  const subtitle = escapeHtml(rec.subtitle || '')
  const price = escapeHtml(rec.price || '')
  const left = Math.max(0, Math.min(100, Math.round(rec.leftPercent ?? 0)))
  const right = Math.max(0, Math.min(100, Math.round(rec.rightPercent ?? 0)))
  const img = rec.image ? escapeHtml(rec.image) : ''

  return `
    <article class="rec-card">
      <div class="rec-thumb">
        ${img ? `<img src="${img}" alt="${name}" />` : ''}
      </div>
      <div class="rec-body">
        <h3 class="rec-name">${name}</h3>
        ${subtitle ? `<p class="rec-sub">${subtitle}</p>` : ''}
        <div class="rec-pcts">
          <div class="pct">
            <span class="pct-label">L ${left}%</span>
            <span class="pct-bar"><span class="pct-fill" style="width:${left}%"></span></span>
          </div>
          <div class="pct">
            <span class="pct-label">R ${right}%</span>
            <span class="pct-bar"><span class="pct-fill" style="width:${right}%"></span></span>
          </div>
        </div>
      </div>
      <div class="rec-price">${price}</div>
    </article>
  `
}

export function buildPdfHtml (data: PdfData): string {
  const name = data.user_info?.name ?? ''
  const greeting = firstName(name)
  const fileTitle = buildPdfFilename(name)
  const recs = data.recommendations
    .map((r) => renderRecommendationCard(r))
    .join('')
  const left = data.fussscans?.leftFootImage
  const right = data.fussscans?.rightFootImage

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(fileTitle)}</title>
  <style>
    /*
     * margin: 0 removes the printer's default page margins, which is what
     * suppresses the browser's automatic header / footer (date, page title,
     * URL, page numbers). The dark page background can then run edge-to-edge.
     */
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
        Arial, sans-serif;
      color: #f4f6f8;
      background: #060709;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* Make sure even short documents fill the printed page with the dark
     * background instead of falling back to white at the bottom. */
    html { min-height: 100%; }
    body {
      min-height: 100vh;
      padding: 10mm 14mm 12mm;
      background: #060709;
      display: flex;
      flex-direction: column;
    }
    h1, h2, h3, p { margin: 0; }
    /* Pushes the footer to the bottom of the page when the content does
     * not fill the full vertical space (single-page layout). */
    .page-footer {
      margin-top: auto;
      padding-top: 36px;
      padding-bottom: 10px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* ---- Footer (matches mockup: thanks + green rule + tagline) ---- */
    .thanks {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      line-height: 1.45;
      letter-spacing: 0.02em;
      color: #ffffff;
    }
    .footer-rule {
      width: 100%;
      height: 1px;
      margin: 24px 0 0;
      padding: 0;
      border: none;
      background: #2d4f3c;
      flex-shrink: 0;
    }
    .legal {
      margin: 22px 0 0;
      font-size: 10px;
      font-weight: 400;
      line-height: 1.55;
      letter-spacing: 0.1em;
      text-transform: none;
      color: rgba(255, 255, 255, 0.38);
    }

    .doc-title {
      text-align: center;
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.01em;
    }
    .doc-intro {
      max-width: 520px;
      margin: 8px auto 18px;
      text-align: center;
      font-size: 12px;
      color: rgba(255,255,255,0.65);
      line-height: 1.55;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(96,164,133,0.55), transparent);
      margin: 6px 0 14px;
    }

    .section-title {
      text-align: center;
      letter-spacing: 0.22em;
      font-size: 11px;
      font-weight: 700;
      color: rgb(120,220,180);
      text-transform: uppercase;
      margin: 0 0 12px;
    }

    /* ---- Recommendation card ---- */
    .rec-grid { display: flex; flex-direction: column; gap: 10px; }
    .rec-card {
      display: grid;
      grid-template-columns: 92px 1fr auto;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      border-radius: 14px;
      background: linear-gradient(155deg, rgba(22,28,38,0.96), rgba(10,12,16,0.96));
      border: 1px solid rgba(255,255,255,0.07);
    }
    .rec-thumb {
      width: 92px; height: 64px;
      border-radius: 10px;
      background: linear-gradient(160deg, #f4f6f9, #d8dde2);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .rec-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .rec-name {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #fff;
    }
    .rec-sub {
      margin-top: 3px;
      font-size: 11px;
      color: rgba(120,220,180,0.95);
    }
    .rec-pcts {
      margin-top: 8px;
      display: flex;
      gap: 14px;
    }
    .pct { display: flex; align-items: center; gap: 6px; min-width: 78px; }
    .pct-label {
      font-size: 9.5px;
      font-weight: 700;
      color: rgba(255,255,255,0.78);
      letter-spacing: 0.04em;
    }
    .pct-bar {
      flex: 1;
      height: 4px;
      border-radius: 9999px;
      background: rgba(255,255,255,0.10);
      overflow: hidden;
      display: inline-block;
      min-width: 36px;
    }
    .pct-fill {
      display: block;
      height: 100%;
      border-radius: 9999px;
      background: linear-gradient(90deg, rgba(96,164,133,0.85), rgba(120,220,180,0.95));
    }
    .rec-price {
      font-size: 13px;
      font-weight: 800;
      color: rgb(150,235,200);
      white-space: nowrap;
      letter-spacing: 0.02em;
    }

    /* ---- Foot scans ---- */
    .fuss-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 6px;
    }
    .fuss-card {
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.07);
      background: linear-gradient(155deg, rgba(22,28,38,0.96), rgba(10,12,16,0.96));
      min-height: 130px;
      display: flex; align-items: center; justify-content: center;
      padding: 12px;
      color: rgba(120,220,180,0.85);
      font-size: 12px;
    }
    .fuss-card img {
      max-width: 100%;
      max-height: 130px;
      object-fit: contain;
      border-radius: 6px;
    }

    /* Make the page break less awkward when printing */
    .rec-card, .fuss-card { page-break-inside: avoid; break-inside: avoid; }
  </style>
</head>
<body>
  <h1 class="doc-title">Hallo ${escapeHtml(greeting)}!</h1>
  <p class="doc-intro">
    Anhand deines Scans und basierend auf deinen Antworten empfehlen wir dir folgende Schuhe:
  </p>
  <div class="divider"></div>

  <p class="section-title">Deine Empfehlungen</p>
  <div class="rec-grid">
    ${recs || '<p style="text-align:center;color:rgba(255,255,255,0.55);font-size:12px;">Keine Empfehlungen verfügbar.</p>'}
  </div>

  <div style="height: 22px;"></div>
  <p class="section-title">Fussscans</p>
  <div class="fuss-grid">
    <div class="fuss-card">
      ${left ? `<img src="${escapeHtml(left)}" alt="Fußscan links" />` : 'Fußscan Bild links'}
    </div>
    <div class="fuss-card">
      ${right ? `<img src="${escapeHtml(right)}" alt="Fußscan rechts" />` : 'Fußscan Bild rechts'}
    </div>
  </div>

  <footer class="page-footer">
    <p class="thanks">Danke ${escapeHtml(greeting)} für dein Vertrauen in FeetF1rst.</p>
    <div class="footer-rule" role="presentation"></div>
    <p class="legal">FeetF1rst — Precision Foot Scanning Technology</p>
  </footer>
</body>
</html>`
}

/* ------------------------------------------------------------------------- */
/*  One-shot generator                                                       */
/* ------------------------------------------------------------------------- */

/**
 * Wait until every image inside `doc` has finished loading (or failed). We
 * resolve regardless of failures so the PDF still renders even when one
 * remote image is unreachable.
 */
function waitForImages (doc: Document): Promise<void> {
  const imgs = Array.from(doc.images)
  if (imgs.length === 0) return Promise.resolve()

  return new Promise<void>((resolve) => {
    let pending = imgs.length
    const done = (): void => {
      pending -= 1
      if (pending <= 0) resolve()
    }
    imgs.forEach((img) => {
      if (img.complete) {
        done()
      } else {
        img.addEventListener('load', done, { once: true })
        img.addEventListener('error', done, { once: true })
      }
    })
    // Hard cap: never block the download for more than 6s on hung images.
    window.setTimeout(resolve, 6000)
  })
}

/**
 * Fetch the recommendation data, render it into a hidden iframe, snapshot
 * the iframe with `html2canvas-pro`, and write the result into a multi-page
 * A4 PDF with `jspdf` — finally calling `pdf.save(filename)` which triggers
 * a direct browser download (no print dialog, no extra tab).
 */
export async function generateRecommendationPdf (scannerId: string): Promise<void> {
  const libsP = Promise.all([import('html2canvas-pro'), import('jspdf')])
  const raw = await fetchRecommendationPdfData(scannerId)
  const data = await hydratePdfDataImages(raw)
  const html = buildPdfHtml(data)
  const filename = `${buildPdfFilename(data.user_info?.name)}.pdf`

  // A4 at 96 dpi — gives html2canvas a sane viewport so layout matches the
  // CSS we wrote (mm based padding etc.).
  const A4_PX_W = 794
  const A4_PX_H = 1123

  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', filename)
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = [
    'position:fixed',
    'left:-99999px',
    'top:0',
    `width:${A4_PX_W}px`,
    `height:${A4_PX_H}px`,
    'border:0',
    'opacity:0',
    'pointer-events:none'
  ].join(';')

  document.body.appendChild(iframe)

  try {
    const doc = iframe.contentDocument
    if (!doc) throw new Error('PDF-Vorschau konnte nicht erstellt werden.')

    doc.open()
    doc.write(html)
    doc.close()

    await waitForImages(doc)
    // Give the layout one more frame to settle once images are decoded.
    await new Promise<void>((r) => requestAnimationFrame(() => r()))

    const [{ default: html2canvas }, { jsPDF }] = await libsP

    const target = doc.body
    // Ensure we measure / snapshot the full body height, even when content
    // overflows the iframe's nominal A4 height.
    const fullHeight = Math.max(
      target.scrollHeight,
      target.offsetHeight,
      A4_PX_H
    )

    // Scale 2 = sharp first-page capture on Retina-ish pixel density.
    const canvas = await html2canvas(target, {
      backgroundColor: '#060709',
      scale: 2,
      // Images are inlined as data: URLs via server proxy — no remote CORS.
      useCORS: false,
      allowTaint: true,
      logging: false,
      width: A4_PX_W,
      height: fullHeight,
      windowWidth: A4_PX_W,
      windowHeight: fullHeight
    })

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: false
    })
    const pageW = pdf.internal.pageSize.getWidth()   // 210
    const pageH = pdf.internal.pageSize.getHeight()  // 297
    const imgW = pageW
    const imgH = (canvas.height * imgW) / canvas.width

    // Maximum JPEG export quality → best subjective output; PDF compress step uses NONE.
    const imgData = canvas.toDataURL('image/jpeg', 1)

    if (imgH <= pageH + 0.5) {
      // Whole report fits on a single A4 page — center it vertically.
      const top = Math.max(0, (pageH - imgH) / 2)
      pdf.addImage(imgData, 'JPEG', 0, top, imgW, imgH)
    } else {
      // Slice the tall canvas image into A4 pages.
      let heightLeft = imgH
      let position = 0
      pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
      heightLeft -= pageH
      while (heightLeft > 0) {
        position = heightLeft - imgH
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
        heightLeft -= pageH
      }
    }

    pdf.save(filename)
  } finally {
    try { iframe.remove() } catch { /* ignore */ }
  }
}
