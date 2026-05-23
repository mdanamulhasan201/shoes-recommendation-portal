'use client'

const LABEL_GREEN = '#5cff8a'

const BODY_CLASS =
  'max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base [&_a]:underline [&_a]:decoration-white/30 [&_a]:underline-offset-2 [&_em]:text-white/75 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_p:first-child]:mt-0 [&_strong]:font-semibold [&_strong]:text-white/90 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6'

export type ShoeDetailProductDescriptionProps = {
  productDescription: string | null | undefined
}

/** Split API `product_description`: optional leading plain text before HTML. */
export function splitProductDescription (raw: string): {
  leadPlain: string | null
  bodyHtml: string | null
  bodyPlain: string | null
} {
  const t = raw.trim()
  if (!t) {
    return { leadPlain: null, bodyHtml: null, bodyPlain: null }
  }

  const tagStart = t.indexOf('<')
  if (tagStart === -1) {
    return { leadPlain: null, bodyHtml: null, bodyPlain: t }
  }

  if (tagStart > 0) {
    const lead = t.slice(0, tagStart).trim()
    if (lead) {
      return {
        leadPlain: lead,
        bodyHtml: t.slice(tagStart).trim(),
        bodyPlain: null
      }
    }
  }

  return { leadPlain: null, bodyHtml: t, bodyPlain: null }
}

export function ShoeDetailProductDescription ({
  productDescription
}: ShoeDetailProductDescriptionProps) {
  const raw = productDescription?.trim()
  if (!raw) return null

  const { leadPlain, bodyHtml, bodyPlain } = splitProductDescription(raw)

  return (
    <section
      className='relative w-full border-t border-white/[0.07] pt-12 sm:pt-14'
      aria-label='Produktbeschreibung'
    >
      <p
        className='kiosk-mono mb-3 text-[10px] font-bold tracking-[0.28em] sm:mb-4'
        style={{
          color: LABEL_GREEN,
          textShadow: `0 0 18px ${LABEL_GREEN}55`
        }}
      >
        PRODUKTBESCHREIBUNG
      </p>

      <div className='product-desc-html flex flex-col gap-3'>
        {leadPlain ? (
          <p className={`${BODY_CLASS} m-0 whitespace-pre-wrap`}>{leadPlain}</p>
        ) : null}

        {bodyPlain ? (
          <div className={`${BODY_CLASS} whitespace-pre-wrap`}>{bodyPlain}</div>
        ) : null}

        {bodyHtml ? (
          <div
            className={`product-desc-html ${BODY_CLASS}`}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : null}
      </div>
    </section>
  )
}
