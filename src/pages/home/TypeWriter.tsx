import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect'
import { Typography } from '@mui/material'
// Types Imports

export function TypewriterEffectSmoothDemo() {
  const words = [
    {
      text: 'SMART'
    },
    {
      text: 'FACTORY'
    },
    {
      text: 'is'
    },
    {
      text: 'SMART FFT.',
      className: 'text-primary dark:text-primary'
    }
  ]
  return (
    <div className='flex flex-col items-center justify-center h-[250px]'>
      <p className='text-neutral-600 dark:text-neutral-200 text-xs sm:text-base'>The road to vision starts from here</p>
      <Typography color={'primary'} variant='h5'>
        {<TypewriterEffectSmooth words={words} />}
      </Typography>

      <div className='flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4'>
        {/* <button className='w-40 h-10 rounded-xl bg-black border dark:border-white border-transparent text-white text-sm'>
          Join now
        </button>
        <button className='w-40 h-10 rounded-xl bg-white text-black border border-black  text-sm'>Signup</button> */}
      </div>
    </div>
  )
}
