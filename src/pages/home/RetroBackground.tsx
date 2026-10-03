import RetroGrid from '@/components/magicui/retro-grid'
import { Typography } from '@mui/material'

export function RetroGridDemo() {
  return (
    <div className='relative flex h-[200px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl bg-primaryLighter'>
      <span className='pointer-events-none z-10 whitespace-pre-wrap bg-primary bg-clip-text text-center text-6xl font-bold leading-none tracking-tighter text-transparent'>
        SMART FFT is YOU
      </span>
      <RetroGrid />
    </div>
  )
}
