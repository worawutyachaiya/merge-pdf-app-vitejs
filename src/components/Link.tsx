// React Imports
import { forwardRef } from 'react'
import type { ForwardedRef, MouseEvent } from 'react'

// React Router Imports
import { Link as RouterLink } from 'react-router'

type LinkProps = {
  to: string
  replace?: boolean
  state?: unknown
  children?: React.ReactNode
}

type Props = Omit<LinkProps, 'to' | 'onClick'> & {
  href?: string
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

const Link = (props: Props, ref: ForwardedRef<HTMLAnchorElement>) => {
  const { href, onClick, ...rest } = props

  return (
    <RouterLink
      ref={ref}
      {...rest}
      to={href || '/'}
      onClick={onClick ? (e) => onClick(e) : !href ? (e) => e.preventDefault() : undefined}
    />
  )
}

export default forwardRef(Link)
