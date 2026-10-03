// React Imports
import { forwardRef } from 'react'

// Next Imports
import { Link } from 'react-router'
// import type { LinkProps } from 'next/link'

type LinkProps = {
  to: string
  replace?: boolean
  state?: unknown
  children?: React.ReactNode
}

// Type Imports
import type { ChildrenType } from '../types'

type RouterLinkProps = LinkProps &
  Partial<ChildrenType> & {
    className?: string
  }

export const RouterLink = forwardRef((props: RouterLinkProps, ref: any) => {
  // Props
  const { to, className, ...other } = props

  return (
    <Link ref={ref} to={to} className={className} {...other}>
      {props.children}
    </Link>
  )
})
