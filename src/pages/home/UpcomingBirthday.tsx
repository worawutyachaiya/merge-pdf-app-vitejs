// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import confetti from 'canvas-confetti'
// Third-party Imports
import classnames from 'classnames'

// Components Imports
import CustomAvatar from '@core/components/mui/Avatar'
import moment from 'moment'
import { getUserData } from '@/utils/user-profile/userLoginProfile'
import { assert } from 'console'

type DataType = {
  icon: string
  title: string
  value: string
}
// Vars
const data: DataType[] = [
  { icon: 'tabler-calendar', title: '17 Nov 23', value: 'Date' },
  { icon: 'tabler-clock', title: '32 Minutes', value: 'Duration' }
]

const checkBirthday = (dataStart: string) => {
  const dateStart = new Date(moment(moment(dataStart)).format('YYYY-MM-DD'))

  const bdMonth = dateStart.getMonth()
  const bdDay = dateStart.getDate()

  const dateNow = new Date(moment(moment(Date.now())).format('YYYY-MM-DD'))

  const birthday = new Date(dateNow.getFullYear(), bdMonth, bdDay)
  if (dateNow.getMonth() == bdMonth && dateNow.getDate() > bdDay) {
    // If true, set Christmas for the next year
    birthday.setFullYear(birthday.getFullYear() + 1)
  }

  const one_day = 1000 * 60 * 60 * 24
  const checkData = Math.ceil((birthday.getTime() - dateNow.getTime()) / one_day)
  checkData <= 5 ? true : false
  return checkData
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

const getCountBirthdayDate = (dataStart: string) => {
  const dateStart = new Date(moment(moment(dataStart)).format('YYYY-MM-DD'))

  const bdMonth = dateStart.getMonth()
  const bdDay = dateStart.getDate()

  const dateNow = new Date(moment(moment(Date.now())).format('YYYY-MM-DD'))

  const birthday = new Date(dateNow.getFullYear(), bdMonth, bdDay)
  if (dateNow.getMonth() == bdMonth && dateNow.getDate() > bdDay) {
    // If true, set Christmas for the next year
    birthday.setFullYear(birthday.getFullYear() + 1)
  }

  const one_day = 1000 * 60 * 60 * 24

  return (
    'You have ' +
    Math.abs(Math.ceil((dateNow.getTime() - birthday.getTime()) / one_day)) +
    ' days left until your Birthday!'
  )
}

const UpcomingBirthday = () => {
  const chkBirth: boolean = checkBirthday(getUserData()?.BIRTH_DATE) || 0

  return (
    <>
      <Card>
        <CardContent className='flex flex-col gap-1'>
          <div className='flex justify-center pli-2 pbs-2 rounded bg-primaryLight'>
            <img src='/images/logos/2.png' className='bs-[70px] mbe-1' />
          </div>
          <div className='flex flex-col items-center'>
            <Typography variant='h6' className='mbe-1'>
              Say 👋🏻 to New Version
            </Typography>
            {/* <Typography variant='body2'>{getCountBirthdayDate(getUserData()?.BIRTH_DATE)}</Typography> */}
          </div>

          <Button onClick={handleClick} variant='contained'>
            Version 2.0.0
          </Button>
        </CardContent>
      </Card>
    </>
  )
}

export default UpcomingBirthday
