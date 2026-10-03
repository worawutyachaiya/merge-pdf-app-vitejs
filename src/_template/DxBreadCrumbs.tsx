import { Breadcrumbs, Divider, Link, Typography } from '@mui/material'

interface Props {
  menuName: string
  breadcrumbNavigation: { menuName: string; href?: string }[]
}

const DxBreadCrumbs = ({ menuName, breadcrumbNavigation }: Props) => {
  return (
    <>
      <Typography
        variant='h4'
        sx={{
          display: 'inline-block'
        }}
      >
        {menuName}
      </Typography>
      <Divider orientation='vertical' className='mx-4' />
      <Breadcrumbs
        separator='›'
        aria-label='breadcrumb'
        sx={{
          display: 'inline-block'
        }}
      >
        {breadcrumbNavigation.map((item, index) => {
          const isLastItem = index === breadcrumbNavigation.length - 1

          return item?.href ? (
            <Link
              key={index}
              underline='hover'
              color={
                isLastItem
                  ? 'var(--mui-palette-text-primary) !important'
                  : 'var(--mui-pallet-text-secondary) !important'
              }
              href={item.href}
            >
              {item.menuName}
            </Link>
          ) : (
            <Typography
              key={index}
              sx={{
                color: isLastItem
                  ? 'var(--mui-palette-text-primary) !important'
                  : 'var(--mui-pallet-text-secondary) !important'
              }}
            >
              {item.menuName}
            </Typography>
          )
        })}
      </Breadcrumbs>
    </>
  )
}

export default DxBreadCrumbs
