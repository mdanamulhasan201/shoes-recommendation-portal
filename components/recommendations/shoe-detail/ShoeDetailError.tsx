'use client'

type ShoeDetailErrorProps = {
  message: string
  onBackToSelection: () => void
}

export function ShoeDetailError ({ message, onBackToSelection }: ShoeDetailErrorProps) {
  return (
    <div className='flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#050505] px-6 text-center'>
      <p className='text-red-400'>{message}</p>
      <button
        type='button'
        onClick={onBackToSelection}
        className='rounded-full border border-white/20 px-6 py-2 text-sm text-white'
      >
        Zurück zur Auswahl
      </button>
    </div>
  )
}
