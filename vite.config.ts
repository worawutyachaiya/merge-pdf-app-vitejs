import react from '@vitejs/plugin-react'

import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import { fileURLToPath } from 'node:url'

const projectDirectory = path.dirname(fileURLToPath(import.meta.url))
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  console.log('------------------------------------')
  console.log('Vite running in mode:', mode)

  console.log('Loaded from .env file:')
  for (const [key, value] of Object.entries(env)) {
    console.log(`  ${key} = ${value}`)
  }
  console.log('------------------------------------')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 8105
    },
    resolve: {
      alias: {
        '@': path.resolve(projectDirectory, './src'),
        '@core': path.resolve(projectDirectory, './src/@core'),
        '@layouts': path.resolve(projectDirectory, './src/@layouts'),
        '@menu': path.resolve(projectDirectory, './src/@menu'),
        '@assets': path.resolve(projectDirectory, './src/assets'),
        '@components': path.resolve(projectDirectory, './src/components'),
        '@configs': path.resolve(projectDirectory, './src/configs'),
        '@views': path.resolve(projectDirectory, './src/views'),
        '@_workspace': path.resolve(projectDirectory, './src/_workspace'),
        '@libs': path.resolve(projectDirectory, './src/libs'),
        '@utils': path.resolve(projectDirectory, './src/utils')
      }
    },
    define: Object.fromEntries(Object.entries(env).map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)]))
  }
})
