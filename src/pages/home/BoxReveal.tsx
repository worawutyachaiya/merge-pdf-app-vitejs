import BoxReveal from '@/components/ui/box-reveal'
import { Button, Typography } from '@mui/material'
import { color } from 'framer-motion'

export function BoxRevealDemo() {
  return (
    <div className='h-full w-full  items-center justify-center overflow-hidden pt-1 mx-auto flex flex-col'>
      <BoxReveal boxColor='var(--mui-palette-primary-main)' duration={0.5}>
        <p className='text-[3.5rem] font-semibold'>SMART FFT</p>
      </BoxReveal>

      <BoxReveal boxColor='var(--mui-palette-primary-main)' duration={0.5}>
        <h2 className='text-[1rem] '>
          become to <span className='font-bold text-primary'>SMART FACTORY</span>
        </h2>
      </BoxReveal>

      <BoxReveal boxColor='var(--mui-palette-primary-main)' duration={0.5}>
        <div className='mt-1'>
          <Typography>
            We transform businesses of all sectors with powerful, technologies and innovations that satisfy the needs of
            today.
          </Typography>

          {/* <p>
            Boost Your Performance Solutions With
            <span className='text-primary'> ERP</span>,<span className='text-primary'> IOT</span>,
            <span className='text-primary'> HR SYSTEM</span>,<span className='text-primary'> CLOUD COMPUTING</span>,
            <span className='text-primary'> PRODUCTION CONTROL</span>, and
            <span className='text-primary'> SECURITY CENTER</span>
            . <br />
          </p> */}
        </div>
      </BoxReveal>

      {/* <BoxReveal boxColor={'#5046e6'} duration={0.5}>
        <Button className='mt-[1.6rem] bg-[#5046e6]'>Explore</Button>
      </BoxReveal> */}
    </div>
  )
}
