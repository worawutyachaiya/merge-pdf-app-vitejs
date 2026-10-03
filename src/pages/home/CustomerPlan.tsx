// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import MuiButton from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import type { ButtonProps } from '@mui/material/Button'

// Component Imports
import UpgradePlan from '@components/dialogs/upgrade-plan'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

import confetti from 'canvas-confetti'

const Button = styled(MuiButton)<ButtonProps>(() => ({
  backgroundColor: 'var(--mui-palette-common-white) !important',
  color: 'var(--mui-palette-primary-main) !important'
}))

const CustomerPlan = () => {
  // Vars
  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: 'Upgrade To Premium'
  }

  const handleClick = () => {
    const duration = 5 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)
  }

  return (
    <Card>
      <CardContent className='flex flex-col gap-6 bg-gradient-to-tr	from-primary to-[#9E95F5]'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col gap-4'>
            <Typography variant='h5' color='common.white'>
              Say 👋🏻 to New Version
            </Typography>
            <Typography color='common.white'>Change log</Typography>

            {/* <Typography variant='subtitle1' className='mbe-2'>
              Changelog
            </Typography> */}
          </div>
          {/* <img src='/images/dx/3d-rocket.png' className='-mis-7 -mbe-7' /> */}
        </div>
        <Button onClick={handleClick} variant='contained'>
          VERSION 2.0.0
        </Button>
        {/* <OpenDialogOnElementClick element={Button} elementProps={buttonProps} dialog={UpgradePlan} /> */}
      </CardContent>
    </Card>
  )
}

export default CustomerPlan
