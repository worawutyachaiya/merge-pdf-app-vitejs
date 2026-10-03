// MUI Imports
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Types Imports
import type { ThemeColor } from '@core/types'

type DataType = {
  name: string
  title: string
  description: string
  position: string
  type: string
  image: string
  color: ThemeColor
  imageColorClass?: string
  bgColorClass?: string
  factory: string
}

// Vars
const data: DataType[] = [
  {
    name: 'Hideya Moridaira',
    position: 'President',
    title: 'Earn a Certificate',
    description:
      '“Strengthening and transforming the businesses” to become a corporate group that further benefits society.',
    type: 'Programs',
    image: '/images/cards/user_pre_3.png',
    color: 'primary',
    imageColorClass: 'bg-primaryLight',
    bgColorClass: 'bg-primaryLighter',
    factory: 'Furukawa Electric Co.,Ltd.'
  },
  {
    name: 'Hidetoshi Tsukamoto',
    position: 'Managing Director',
    title: 'Best Rated Courses',
    description: 'Be innovative creative & profitable be an excellent company in one furukawa.',
    type: 'Courses',
    image: '/images/cards/user_tsuka.png',
    color: 'primary',
    imageColorClass: 'bg-primaryLight',
    bgColorClass: 'bg-primaryLighter',
    factory: 'Furukawa FITEL (Thailand) Co.,Ltd.'
  }
]

// โหลดรูปทั้งหมดใน assets/cards
const images = import.meta.glob('@/assets/images/cards/*.{png,jpg,jpeg,svg}', {
  eager: true,
  import: 'default'
}) as Record<string, string>

// helper แปลง path
const getImage = (imgPath: string) => {
  const filename = imgPath.split('/').pop() ?? ''
  const key = `/src/assets/images/cards/${filename}`
  return images[key]
}

const DirectorCard = () => {
  // Hooks
  const theme = useTheme()

  return (
    <Grid container spacing={6}>
      {data.map((item, index) => (
        <Grid size={{ xs: 12, md: 6 }} key={index}>
          <div
            className={classnames(
              'flex max-sm:flex-col items-center sm:items-start justify-between gap-6 rounded p-6',
              item.bgColorClass
            )}
          >
            <div className='flex flex-col items-center sm:items-start max-sm:text-center'>
              <Typography variant='h5' color={item.color} className='mbe-2'>
                {item.name}
              </Typography>
              <Typography className='mbe-4'>{item.description}</Typography>
              <Button variant='contained' size='small' color={item.color}>{`${item.position}`}</Button>
              <Typography variant='subtitle2' className='mt-2'>
                at {item.factory}
              </Typography>
            </div>
            <div
              className={classnames(
                'flex justify-center rounded min-is-[180px] max-sm:-order-1 pbs-[7px]',
                item.imageColorClass
              )}
            >
              <img
                //src={item.image}
                src={getImage(item.image)}
                alt={item.title}
                className={classnames('bs-[120px]', { 'scale-x-[-1]': theme.direction === 'rtl' })}
              />
            </div>
          </div>
        </Grid>
      ))}
    </Grid>
  )
}

export default DirectorCard
