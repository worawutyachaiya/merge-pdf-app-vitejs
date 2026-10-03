// Third-party Imports
import './integration.css'

// Hook Imports
import { useTheme } from '@emotion/react'

import { useSettings } from '@core/hooks/useSettings'

const Integration = (integrations: any) => {
  // Hooks
  const theme = useTheme()
  const { settings } = useSettings()

  return (
    <div className='integration pt-20' data-scroll-index='3'>
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
          className='title_small text-small'
        ></small> */}
        <h2 className='mb-5 text'>
          {'Road to'}
          <span>{' SMART FACTORY'}</span>
        </h2>
        <p className='mb-20'>
          {'BE INNOVATIVE, CREATIVE AND PROFITABLE BE AN EXCELLENT COMPANY IN '}
          <small
            style={{
              fontSize: '15px',
              backgroundColor:
                settings.mode == 'light'
                  ? 'var(--mui-palette-secondary-lighterOpacity)'
                  : 'var(--mui-palette-action-selected)',
              color: settings.mode == 'light' ? 'var(--toastify-color-error)' : 'var(--toastify-color-progress-dark)'
            }}
            className='title_small text-small'
          >
            {'ONE FURUKAWA'}
          </small>
        </p>
      </div>
      <div className='container'>
        <div className='content'>
          {integrations?.integrations?.map((integration: any, index: number) => (
            <div className='img' key={index}>
              <img src={integration} alt='' className='mt-30' />
            </div>
          ))}
        </div>
      </div>

      {/* <img src='/img/about/intg_back.png' alt='' className='intg-back' /> */}
    </div>
  )
}

export default Integration
