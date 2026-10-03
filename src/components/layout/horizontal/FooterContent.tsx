'use client'

// Next Imports
//import Link from 'next/link'
import { Link } from 'react-router'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()

  return (
    <div
      className={classnames(horizontalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p>
        <span className="text-textSecondary">{`© ${new Date().getFullYear()}, Made with `}</span>
        <span>{`❤️`}</span>
        <span className="text-textSecondary">{` by `}</span>
        <Link to="https://pixinvent.com/" target="_blank" className="text-primary uppercase">
          Pixinvent
        </Link>
      </p>
      {!isBreakpointReached && (
        <div className="flex items-center gap-4">
          <Link to="https://themeforest.net/licenses/standard" target="_blank" className="text-primary">
            License
          </Link>
          <Link to="https://themeforest.net/user/pixinvent/portfolio" target="_blank" className="text-primary">
            More Themes
          </Link>
          <Link
            to="https://demos.pixinvent.com/vuexy-nextjs-admin-template/documentation"
            target="_blank"
            className="text-primary"
          >
            Documentation
          </Link>
          <Link to="https://pixinvent.ticksy.com" target="_blank" className="text-primary">
            Support
          </Link>
        </div>
      )}
    </div>
  )
}

export default FooterContent
