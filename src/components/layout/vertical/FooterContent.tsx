'use client'

// Next Imports
//import Link from 'next/link'
import { Link } from 'react-router'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav()

  return (
    <div
      className={classnames(verticalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p>
        <span className="text-textSecondary">{`© 2022 `}</span>
        <Link to="https://www.fitel.co.th/" target="_blank" className="text-primary">
          Smart FFT
        </Link>
        <span> , All rights reserved.</span>
      </p>
      {!isBreakpointReached && <div className="flex items-center gap-4">Design & Develop by Software section</div>}
    </div>
  )
}

export default FooterContent
