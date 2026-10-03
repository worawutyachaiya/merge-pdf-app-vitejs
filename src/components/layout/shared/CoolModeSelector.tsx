import { useMemo, useState, type MouseEvent } from 'react'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { CoolMode } from '@/components/ui/cool-mode'
import { useCoolModeStore, type CoolModeParticle } from '@/libs/zustand/stores/useCoolModeStore'

type CoolModeOption = {
  label: string
  particle: CoolModeParticle
}

const COOL_MODE_OPTIONS: CoolModeOption[] = [
  { label: 'Colorful circles', particle: 'circle' },
  { label: 'Lucky clover', particle: '☘️' },
  { label: 'Snowflake', particle: '❄️' },
  { label: 'Flying money', particle: '💸' },
  { label: 'Heart', particle: '❤️' },
  { label: 'Sparkles', particle: '✨' }
]

const ParticlePreview = ({ particle }: { particle: CoolModeParticle }) => {
  if (particle === 'circle') {
    return (
      <Box
        aria-label='Colorful circles'
        sx={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2f80ed 10%, #22c55e 45%, #f43f5e 80%)'
        }}
      />
    )
  }

  return (
    <Typography component='span' sx={{ fontSize: 20, lineHeight: 1 }}>
      {particle}
    </Typography>
  )
}

const CoolModeSelector = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const particle = useCoolModeStore(state => state.particle)
  const setParticle = useCoolModeStore(state => state.setParticle)

  const selectedOption = COOL_MODE_OPTIONS.find(option => option.particle === particle) ?? COOL_MODE_OPTIONS[0]
  const particleOptions = useMemo(() => ({ particle }), [particle])

  const handleMenuOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleSelect = (nextParticle: CoolModeParticle) => {
    setParticle(nextParticle)
    setAnchorEl(null)
  }

  return (
    <Box display='flex' alignItems='center'>
      <CoolMode options={particleOptions}>
        <Tooltip title={`Cool Mode: ${selectedOption.label}`}>
          <IconButton className='text-textPrimary' aria-label={`Use ${selectedOption.label} Cool Mode effect`}>
            <i className='tabler-pacman text-[22px]' />
          </IconButton>
        </Tooltip>
      </CoolMode>

      <Tooltip title='Choose Cool Mode effect'>
        <IconButton
          size='small'
          aria-label='Choose Cool Mode effect'
          aria-controls={anchorEl ? 'cool-mode-menu' : undefined}
          aria-expanded={anchorEl ? 'true' : undefined}
          aria-haspopup='menu'
          onClick={handleMenuOpen}
          sx={{ ml: -1.5 }}
        >
          <i className='tabler-chevron-down text-sm' />
        </IconButton>
      </Tooltip>

      <Menu
        id='cool-mode-menu'
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        disableScrollLock
      >
        {COOL_MODE_OPTIONS.map(option => (
          <MenuItem
            key={option.particle}
            selected={option.particle === particle}
            onClick={() => handleSelect(option.particle)}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ParticlePreview particle={option.particle} />
            </ListItemIcon>
            <ListItemText primary={option.label} />
            {option.particle === particle && <i className='tabler-check ml-4 text-primary' />}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

export default CoolModeSelector
