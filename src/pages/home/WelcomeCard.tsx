// React Imports
import type { ReactNode } from 'react'

// Next Imports

import ComputerIcon from '@mui/icons-material/ComputerRounded'
import CardTravelIcon from '@mui/icons-material/CardTravel'
import BusinessIcon from '@mui/icons-material/Business'
import StarBorder from '@mui/icons-material/StarBorder'
// MUI Imports
import Divider from '@mui/material/Divider'

import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

// Third-party Imports

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

import WeatherApp from './Weather'
import { SparklesText } from '@/components/ui/sparkles-text'

// Styled Component Imports

type DataType = {
  title: string
  value: string
  color: ThemeColor
  icon: ReactNode
}

// Vars
const data: DataType[] = [
  {
    title: 'Job Grade',
    value: getUserData()?.JOB_GRADE,
    color: 'primary',
    icon: <StarBorder sx={{ width: 30, height: 30 }} />
  },
  {
    title: 'Position Name',
    value: getUserData()?.POSITION_NAME,
    color: 'primary',
    icon: <ComputerIcon sx={{ width: 30, height: 30 }} />
  },
  {
    title: 'Department',
    value: getUserData()?.DEPARTMENT_NAME,
    color: 'primary',
    icon: <BusinessIcon sx={{ width: 30, height: 30 }} />
  },
  {
    title: 'Section',
    value: getUserData()?.SECTION_NAME,
    color: 'primary',
    icon: <CardTravelIcon sx={{ width: 30, height: 30 }} />
  }
]

const WelcomeCard = () => {
  // Hooks
  const theme = useTheme()
  const belowMdScreen = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <>
      <div className='flex max-md:flex-col md:items-center gap-11 plb-6'>
        <div style={{ alignSelf: 'start' }} className='md:is-8/12'>
          <div className='flex items-baseline gap-1 mbe-2'>
            <Typography variant='h5'>Welcome back,</Typography>
            <SparklesText className='text-4xl'>
              {getUserData()?.FIRST_NAME?.charAt?.(0)?.toUpperCase() +
                getUserData()?.FIRST_NAME?.toLowerCase()?.slice(1)}
            </SparklesText>
          </div>
          <div className='mbe-8'>
            <Typography>Let&apos;s keep going and have a good day !</Typography>
          </div>
          <div className='flex flex-wrap max-md:flex-col justify-between gap-6'>
            {data.map((item, i) => (
              <div key={i} className='flex gap-4'>
                <CustomAvatar variant='rounded' skin='light' size={40} color={item.color}>
                  {item.icon}
                </CustomAvatar>
                <div>
                  <Typography className='font-medium'>{item.title}</Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: 500 }} color={`${item.color}.main`}>
                    {item.value}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Divider orientation={belowMdScreen ? 'horizontal' : 'vertical'} flexItem />
        <div className='justify-between md:is-4/12'>
          <div>
            <WeatherApp />
          </div>
        </div>
      </div>
    </>
  )
}

export default WelcomeCard
