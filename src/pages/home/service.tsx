import { useState, useEffect, useRef } from 'react'

import './service.css'
import { getUserData } from '@/utils/user-profile/userLoginProfile'

const { EMAIL, SECTION_NAME, FIRST_NAME, LAST_NAME, JOB_GRADE, EMPLOYEE_CODE } = getUserData()

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

import { useTheme } from '@emotion/react'

const numbers = [
  {
    image: '/img/icons/numbers/8.png',
    value: FIRST_NAME + ' ' + LAST_NAME,
    operator: 'M+',
    title: EMAIL
  },
  {
    image: '/img/icons/numbers/11.png',
    value: EMPLOYEE_CODE,
    operator: 'K+',
    title: 'Employee Code'
  },
  {
    image: '/img/icons/numbers/9.png',
    value: JOB_GRADE,
    operator: 'M+',
    title: 'Position'
  },
  {
    image: '/img/icons/numbers/10.png',
    value: SECTION_NAME,
    operator: 'M+',
    title: 'Section'
  }
]

const Numbers = () => {
  const { settings } = useSettings()

  return (
    <section className='numbers style-8 pt-0'>
      <div className='container'>
        <div className='section-head style-8 text-center mb-5 wow fadeInUp'>
          <h6> Welcome to</h6>
          <h3>EAR</h3>
        </div>
      </div>
      <div className='numbers-btm'>
        <div className='container'>
          <div
            style={{
              backgroundColor:
                settings.mode == 'light'
                  ? 'var(--mui-palette-secondary-lighterOpacity)'
                  : 'var(--mui-palette-background-paper)',
              color:
                settings.mode == 'light' ? 'var(--mui-palette-text-primary)' : 'var(--mui-palette-primary-contrastText)'
            }}
            className='numbers-content'
          >
            <div className='row'>
              {numbers.map((number, idx) => (
                <div className='col-lg-3 col-sm-6' key={idx}>
                  <div className='number-card  style-8 mt-4 mt-lg-0 wow fadeInUp'>
                    <div className='icon'>
                      <img src={number.image} alt='' />
                    </div>
                    <div className='inf'>
                      <h3 className='counter text'> {number.value}</h3>
                      <p className='text'>{number.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <img src='/assets/img/icons/numbers/7.png' alt='' className='r_shape rotate-center' />
    </section>
  )
}

export default Numbers
