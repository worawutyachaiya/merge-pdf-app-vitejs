// React Imports
import { useState } from 'react'

// MUI Imports
import Badge from '@mui/material/Badge'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

// Third-party Components
import classnames from 'classnames'
import { useKeenSlider } from 'keen-slider/react'
import type { KeenSliderPlugin } from 'keen-slider/react'

// Components Imports
import CustomAvatar from '@core/components/mui/Avatar'
import type { ThemeColor } from '@core/types'

import AppKeenSlider from '@/libs/styles/AppKeenSlider'

type DataType = {
  img: string
  name: string
  position: string
  quote1: string
  quote2: string
  color: ThemeColor
  imageColorClass: string
  bgColorClass: string
  factory: string
  details: { [key: string]: string }
}

// Vars
const data: DataType[] = [
  {
    name: 'Hideya Moridaira',
    quote1: '“Strengthening and transforming the businesses”',
    quote2: 'to become a corporate group that further benefits society',
    position: 'President',
    factory: 'Furukawa Electric Co.,Ltd.',
    color: 'primary',
    imageColorClass: 'bg-primaryLight',
    bgColorClass: 'bg-primaryLighter',
    img: '/images/cards/user_pre_3.png',
    details: {
      Group: '119',
      Founded: '1884'
    }
  },

  {
    name: 'Hidetoshi Tsukamoto',
    quote1: '“Be innovative creative & profitable be',
    quote2: 'an excellent company in one furukawa”',
    position: 'Managing Director',
    factory: 'Furukawa Electric Co.,Ltd.',
    img: '/images/cards/user_tsuka.png',
    color: 'info',
    imageColorClass: 'bg-infoLight',
    bgColorClass: 'bg-infoLighter',
    details: {
      Products: '46',
      Employee: '2.1k'
    }
  }
]

// โหลดรูปทั้งหมดใน assets/cards
const images = import.meta.glob('@/assets/cards/*.{png,jpg,jpeg,svg}', {
  eager: true,
  import: 'default'
}) as Record<string, string>

// helper แปลง path
const getImage = (imgPath: string) => {
  const filename = imgPath.split('/').pop() ?? ''
  const key = `/src/assets/cards/${filename}`
  return images[key]
}

const Slides = () => {
  return (
    <>
      {data.map((slide: DataType, index: number) => {
        return (
          <div key={index} className={classnames('keen-slider__slide p-6 pbe-3 is-full ', slide.bgColorClass)}>
            <Typography
              // sx={{ textShadow: '0 0 20px rgba(0,0,0,1)' }}
              variant='h6'
              className='mbe-0.5 text-[var(--mui-palette-common-white)]'
            >
              {slide.quote1}
            </Typography>
            <Typography
              // sx={{ textShadow: '0 0 20px rgba(0,0,0,1)' }}
              variant='h6'
              className='mbe-3 text-[var(--mui-palette-common-white)]'
            >
              {slide.quote2}
            </Typography>
            <Grid container spacing={4} className='relative'>
              <Grid item xs={12} sm={8} className='order-2 sm:order-1'>
                <div className='flex flex-col sm:plb-6'>
                  <Typography color={slide.color} className='font-medium text-[var(--mui-palette-common-white)]'>
                    {slide.name}
                  </Typography>
                  <Typography
                    color={slide.color}
                    variant='subtitle2'
                    className='mbe-3 text-[var(--mui-palette-common-white)]'
                  >
                    {slide.position}
                    <Typography variant='subtitle2' component='span'>
                      {' '}
                      {slide.factory}
                    </Typography>
                  </Typography>
                  <Grid container spacing={4}>
                    {Object.keys(slide.details).map((key: string, index: number) => {
                      return (
                        <Grid item key={index} xs={6}>
                          <div className='flex items-center gap-0.5'>
                            <CustomAvatar
                              color='primary'
                              variant='rounded'
                              className='font-medium mie-2 text-white bg-[var(--mui-palette-primary-dark)] bs-[30px] is-12'
                            >
                              {slide.details[key]}
                            </CustomAvatar>
                            <Typography color={slide.color} noWrap className='text-[var(--mui-palette-common-white)]'>
                              {key}
                            </Typography>
                          </div>
                        </Grid>
                      )
                    })}
                  </Grid>
                </div>
              </Grid>
              <Grid item xs={12} sm={4} className='flex justify-center order-1 sm:order-2'>
                <img
                  src={getImage(slide.img)}
                  height={1}
                  className='max-bs-[120px] lg:bs-[120px] xl:bs-[120px] drop-shadow-[0_4px_60px_rgba(0,0,0,0.5)] sm:absolute bottom-3 end-0'
                />
              </Grid>
            </Grid>
          </div>
        )
      })}
    </>
  )
}

const WebsiteAnalyticsSlider = () => {
  // States
  const [loaded, setLoaded] = useState<boolean>(false)
  const [currentSlide, setCurrentSlide] = useState<number>(0)

  // Hooks
  const theme = useTheme()

  const ResizePlugin: KeenSliderPlugin = slider => {
    const observer = new ResizeObserver(function () {
      slider.update()
    })

    slider.on('created', () => {
      observer.observe(slider.container)
    })
    slider.on('destroyed', () => {
      observer.unobserve(slider.container)
    })
  }

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      initial: 0,
      rtl: theme.direction === 'rtl',
      slideChanged(slider) {
        setCurrentSlide(slider.track.details.rel)
      },
      created() {
        setLoaded(true)
      }
    },
    [
      ResizePlugin,
      slider => {
        let mouseOver = false
        let timeout: number | ReturnType<typeof setTimeout>

        const clearNextTimeout = () => {
          clearTimeout(timeout as number)
        }

        const nextTimeout = () => {
          clearTimeout(timeout as number)
          if (mouseOver) return
          timeout = setTimeout(() => {
            slider.next()
          }, 3000)
        }

        slider.on('created', () => {
          slider.container.addEventListener('mouseover', () => {
            mouseOver = true
            clearNextTimeout()
          })
          slider.container.addEventListener('mouseout', () => {
            mouseOver = false
            nextTimeout()
          })
          nextTimeout()
        })
        slider.on('dragStarted', clearNextTimeout)
        slider.on('animationEnded', nextTimeout)
        slider.on('updated', nextTimeout)
      }
    ]
  )

  return (
    <AppKeenSlider>
      {/* <Card className='bg-primary'> */}
      <Card>
        <div ref={sliderRef} className='keen-slider relative'>
          {loaded && instanceRef.current && (
            <div className='swiper-dots absolute top-1 inline-end-6'>
              {[...Array(instanceRef.current.track.details.slides.length).keys()].map(idx => {
                return (
                  <Badge
                    key={idx}
                    variant='dot'
                    component='div'
                    className={classnames({
                      active: currentSlide === idx
                    })}
                    onClick={() => {
                      instanceRef.current?.moveToIdx(idx)
                    }}
                    sx={{
                      '& .MuiBadge-dot': {
                        width: '8px !important',
                        height: '8px !important',
                        backgroundColor: 'var(--mui-palette-common-white) !important',
                        opacity: 0.4
                      },
                      '&.active .MuiBadge-dot': {
                        opacity: 1
                      }
                    }}
                  ></Badge>
                )
              })}
            </div>
          )}
          <Slides />
        </div>
      </Card>
    </AppKeenSlider>
  )
}

export default WebsiteAnalyticsSlider
