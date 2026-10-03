import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

import {
  useSeasonalThemeStore,
  type SeasonalTheme,
  type SeasonalThemeIntensity
} from '@/libs/zustand/stores/useSeasonalThemeStore'

const THEME_OPTIONS: Array<{ value: SeasonalTheme; label: string; icon: string }> = [
  { value: 'default', label: 'Default', icon: 'tabler-ban' },
  { value: 'winter', label: 'Winter', icon: 'tabler-snowflake' },
  { value: 'rainy', label: 'Rainy', icon: 'tabler-cloud-rain' },
  { value: 'autumn', label: 'Autumn', icon: 'tabler-leaf' }
]

const SeasonalThemeCustomizer = () => {
  const theme = useSeasonalThemeStore(state => state.theme)
  const intensity = useSeasonalThemeStore(state => state.intensity)
  const setTheme = useSeasonalThemeStore(state => state.setTheme)
  const setIntensity = useSeasonalThemeStore(state => state.setIntensity)

  return (
    <Stack spacing={2}>
      <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Box>
          <Typography variant='subtitle2'>Seasonal theme</Typography>
          {/* <Typography variant='caption' color='text.secondary'>
            Add an ambient effect.
          </Typography> */}
        </Box>
        {/* {theme !== 'default' && (
          <Button
            variant='text'
            size='small'
            startIcon={<i className='tabler-restore text-base' />}
            onClick={() => setTheme('default')}
            sx={{ minInlineSize: 'auto', whiteSpace: 'nowrap' }}
          >
            Reset theme
          </Button>
        )} */}
      </Stack>

      <Box display='grid' gridTemplateColumns='repeat(2, minmax(0, 1fr))' gap={1}>
        {THEME_OPTIONS.map(option => (
          <Button
            key={option.value}
            size='small'
            variant={theme === option.value ? 'contained' : 'outlined'}
            color={theme === option.value ? 'primary' : 'secondary'}
            startIcon={<i className={`${option.icon} text-base`} />}
            onClick={() => setTheme(option.value)}
            sx={{ justifyContent: 'flex-start' }}
          >
            {option.label}
          </Button>
        ))}
      </Box>

      <Box>
        <Typography variant='subtitle2' display='block' mb={1}>
          Effect intensity
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size='small'
          value={intensity}
          disabled={theme === 'default'}
          onChange={(_, value: SeasonalThemeIntensity | null) => {
            if (value) setIntensity(value)
          }}
          aria-label='Seasonal theme effect intensity'
        >
          <ToggleButton value='low'>Low</ToggleButton>
          <ToggleButton value='medium'>Medium</ToggleButton>
          <ToggleButton value='high'>High</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Stack>
  )
}

export default SeasonalThemeCustomizer
