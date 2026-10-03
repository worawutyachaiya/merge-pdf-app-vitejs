import react from '@vitejs/plugin-react'

import { defineConfig, loadEnv } from 'vite'
import path from 'path'
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
      port: 8097
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@core': path.resolve(__dirname, './src/@core'),
        '@layouts': path.resolve(__dirname, './src/@layouts'),
        '@menu': path.resolve(__dirname, './src/@menu'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@components': path.resolve(__dirname, './src/components'),
        '@configs': path.resolve(__dirname, './src/configs'),
        '@views': path.resolve(__dirname, './src/views'),
        '@_workspace': path.resolve(__dirname, './src/_workspace'),
        '@libs': path.resolve(__dirname, './src/libs'),
        '@utils': path.resolve(__dirname, './src/utils')
      }
    },
    define: Object.fromEntries(Object.entries(env).map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)]))
  }
})
