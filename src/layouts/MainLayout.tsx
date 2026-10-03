// MUI Imports
import Button from '@mui/material/Button'

// Type Imports
// import type { ChildrenType } from '@core/types'
// import type { Locale } from '@configs/i18n'

// Layout Imports
// import LayoutWrapper from '@components/@layouts/LayoutWrapper'
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import HorizontalLayout from '@layouts/HorizontalLayout'

// Component Imports
import Providers from '@components/Providers'
import Navigation from '@components/layout/vertical/Navigation'
import Header from '@components/layout/horizontal/Header'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import HorizontalFooter from '@components/layout/horizontal/Footer'
import EnvironmentMarquee from '@components/layout/shared/EnvironmentMarquee'
import ScrollToTop from '@core/components/scroll-to-top'
// import AuthGuard from '@/hocs/AuthGuard'

// Config Imports
// import { i18n } from '@configs/i18n'

// Util Imports
// import { getDictionary } from '@/utils/getDictionary'
import { getMode, getSystemMode } from '@core/utils/serverHelpers'
import { Outlet } from 'react-router'
import { useEffect } from 'react'
import { getDictionary } from '@/utils/getDictionary'
import { i18n, type Locale } from '@/configs/i18n'

const MainLayout = ({ params }: { params: { lang: Locale } }) => {
  // Vars
  const direction = i18n.langDirection[params.lang]
  const dictionary = getDictionary(params.lang)
  const mode = getMode()
  const systemMode = getSystemMode()

  useEffect(() => {
    document.documentElement.classList.add('h-full')
    document.body.classList.add('min-h-screen', 'h-full', 'w-full', 'flex', 'flex-col')

    return () => {
      document.documentElement.classList.remove('h-full')
      document.body.classList.remove('min-h-screen', 'h-full', 'w-full', 'flex', 'flex-col')
    }
  }, [])

  return (
    <Providers direction={direction}>
      {/* <AuthGuard locale={params.lang}> */}
      <LayoutWrapper
        systemMode={systemMode}
        verticalLayout={
          <VerticalLayout
            navigation={<Navigation dictionary={dictionary} mode={mode} />}
            navbar={<Navbar />}
            footer={<VerticalFooter />}
          >
            <Outlet />
          </VerticalLayout>
        }
        horizontalLayout={
          <HorizontalLayout header={<Header dictionary={dictionary} />} footer={<HorizontalFooter />}>
            <Outlet />
          </HorizontalLayout>
        }
      />
      <ScrollToTop className='mui-fixed'>
        <Button variant='contained' className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'>
          <i className='tabler-arrow-up' />
        </Button>
      </ScrollToTop>
      <EnvironmentMarquee />
      {/* </AuthGuard> */}
    </Providers>
  )
}

export default MainLayout
