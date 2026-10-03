import { getSystemMode } from '@/@core/utils/serverHelpers'
import BlankLayout from '@/@layouts/BlankLayout'
import Providers from '@/components/Providers'
import type { Locale } from '@/configs/i18n'
// import { i18n, Locale } from '@/configs/i18n'
import { useEffect } from 'react'
import { Outlet } from 'react-router'

const Layout = ({ params }: { params: { lang: Locale } }) => {
  // Vars

  // const direction = i18n.langDirection[params.lang]
  const direction = 'ltr'
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
      <BlankLayout systemMode={systemMode}>
        <Outlet />
      </BlankLayout>
    </Providers>
  )
}

export default Layout
