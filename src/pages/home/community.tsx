import './community.css'

// Hook Imports

import { useTheme } from '@emotion/react'

import { useSettings } from '@core/hooks/useSettings'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

const { EMAIL, SECTION_NAME, FIRST_NAME, LAST_NAME, JOB_GRADE, EMPLOYEE_CODE, POSITION_NAME, DEPARTMENT_NAME } =
  getUserData()

const data = [
  {
    icon: '/img/icons/numbers/9.png',
    title: FIRST_NAME + ' ' + LAST_NAME,
    description: 'Email : ' + EMAIL
  },

  //   {
  //     icon: '/img/icons/numbers/9.png',
  //     title: EMPLOYEE_CODE,
  //     description: 'Employee Code'
  //   },
  {
    icon: '/img/icons/numbers/10.png',
    title: JOB_GRADE + ' - ' + POSITION_NAME,
    description: 'Position'
  },
  {
    icon: '/img/icons/numbers/11.png',
    title: DEPARTMENT_NAME + ' - ' + SECTION_NAME,
    description: 'Section'
  }
]

const Community = () => {
  // Hooks
  const theme = useTheme()
  const { settings } = useSettings()

  return (
    <section className='community section-padding pt-0 style-4'>
      <div className='container'>
        <div className='section-head text-center style-4'>
          {/* <small
            style={{
              backgroundColor:
                settings.mode == 'light'
                  ? 'var(--mui-palette-secondary-lighterOpacity)'
                  : 'var(--mui-palette-action-selected)',
              color:
                settings.mode == 'light' ? 'var(--mui-palette-text-primary)' : 'var(--mui-palette-primary-contrastText)'
            }}
            className='title_small'
          ></small> */}
          <h4 className='mb-5'>
            <span className='text'>{'MASTER DATA SYSTEM'}</span>{' '}
          </h4>
        </div>
        <div className='content'>
          {data.map((item: any, index: number) => (
            <a href='#' className='commun-card' key={index}>
              <div className='icon'>
                <img src={item.icon} alt='' />
              </div>
              <div className='inf'>
                <h5 className='text'>{item.title}</h5>
                <p className='text-secondary'>{item.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Community
