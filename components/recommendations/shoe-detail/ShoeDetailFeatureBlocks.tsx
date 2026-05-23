'use client'

import { resolveShoeImageSrc } from '@/api/shoeImageSrc'
import type { ReferenceShoeCharacteristic } from '@/components/recommendations/types'

export type ShoeDetailFeatureBlocksProps = {
  items: ReferenceShoeCharacteristic[]
  accentColor: string
}

function elementLabel (index: number) {
  return `ELEMENT_${String(index + 1).padStart(2, '0')}`
}

export function ShoeDetailFeatureBlocks ({
  items,
  accentColor
}: ShoeDetailFeatureBlocksProps) {
  const list = items.filter(
    c =>
      c?.id &&
      (c.title?.trim() || c.text_field?.trim() || c.image?.trim())
  )
  if (list.length === 0) return null

  return (
    <section
      className='relative mt-2 w-full overflow-hidden rounded-2xl border border-white/[0.07] px-4 py-8 sm:mt-4 sm:px-6 sm:py-10'
      style={{
        background:
          'linear-gradient(165deg, rgba(12,14,18,0.98) 0%, rgba(8,9,12,0.99) 100%)',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px'
      }}
      aria-label='Produkthighlights'
    >
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <span
            className='h-1.5 w-1.5 shrink-0 rounded-full'
            style={{
              background: accentColor,
              boxShadow: `0 0 10px ${accentColor}`
            }}
          />
          <p className='kiosk-mono text-[10px] font-bold tracking-[0.22em] text-white/50'>
            FEATURE BLOCKS
          </p>
        </div>
        <p className='kiosk-mono text-[10px] tracking-[0.22em] text-white/40'>
          REPEATABLE
        </p>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6'>
        {list.map((item, i) => {
          const src = item.image?.trim()
            ? resolveShoeImageSrc(item.image)
            : null
          const title = item.title?.trim() ?? ''
          const body = item.text_field?.trim() ?? ''

          return (
            <article
              key={item.id}
              className='flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/8 bg-[#0b0c10]/90 sm:rounded-4xl'
              style={{
                boxShadow:
                  '0 12px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)'
              }}
            >
              <div className='relative aspect-16/10 w-full shrink-0 overflow-hidden bg-neutral-900/80'>
                {src ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={src}
                    alt={title || 'Highlight'}
                    className='h-full w-full object-cover object-center'
                    draggable={false}
                  />
                ) : (
                  <div className='flex h-full items-center justify-center text-[11px] text-white/25'>
                    —
                  </div>
                )}
              </div>
              <div className='flex min-h-0 flex-1 flex-col gap-2 p-4 sm:p-5'>
                <p
                  className='kiosk-mono text-[9px] font-bold tracking-[0.2em]'
                  style={{ color: accentColor }}
                >
                  {elementLabel(i)}
                </p>
                {title ? (
                  <h3 className='text-base font-bold leading-snug text-white sm:text-[1.05rem]'>
                    {title}
                  </h3>
                ) : null}
                {body ? (
                  <p className='text-sm leading-relaxed text-white/55'>{body}</p>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
