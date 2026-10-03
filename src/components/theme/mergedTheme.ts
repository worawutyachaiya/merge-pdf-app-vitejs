/*
 * We recommend using the merged theme if you want to override our core theme.
 * This means you can use our core theme and override it with your own customizations.
 * Write your overrides in the userTheme object in this file.
 * The userTheme object is merged with the coreTheme object within this file.
 * Export this file and import it in the `@components/theme/index.tsx` file to use the merged theme.
 */
import '@fontsource-variable/inter'

// MUI Imports
import { deepmerge } from '@mui/utils'
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { Settings } from '@core/contexts/settingsContext'
import type { SystemMode } from '@core/types'

// Core Theme Imports
import coreTheme from '@core/theme'
import spacing from './spacing'
const mergedTheme = (settings: Settings, mode: SystemMode, direction: Theme['direction']) => {
  // Vars
  const userTheme = {
    // Write your overrides here.
    ...spacing,

    typography: {
      fontFamily: "'Inter Variable', sans-serif"
    },
    components: {
      MuiDivider: {
        styleOverrides: {
          root: {
            ':before': { width: '0%' },
            ':after': { width: '100%' }
          },
          wrapper: {
            paddingLeft: 0
          }
        }
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            backgroundColor:
              mode == 'dark' ? 'var(--mui-palette-primary-darkOpacity)' : 'var(--mui-palette-primary-lightOpacity)',
            padding: '9px 8px 8px 22px'
          }
        }
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            marginTop: '15px'
          }
        }
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            borderTopWidth: 1.5,
            borderColor: 'var(--mui-palette-primary-lightOpacity)'
          }
        }
      }
    },
    colorSchemes: {
      dark: {
        palette: {
          success: {
            main: '#34c38f'
          },

          text: {
            //primary: '#f6f7f9'
            primary: '#ebecf0'
          },
          background: {
            default: '#23272F',
            paper: '#343A46',
            paperChannel: '52 58 73'
          },
          customColors: {
            bodyBg: '#343A46',
            inputBorder: `rgb(var(--mui-mainColorChannels-dark) / 0.11)`
          }
        }
      },
      light: {
        palette: {
          success: {
            main: '#34c38f'
          }
        }
      }
    }
  } as Theme

  return deepmerge(coreTheme(settings, mode, direction), userTheme)
}

export default mergedTheme
