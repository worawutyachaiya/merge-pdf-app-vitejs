module.exports = {
  apps: [
    {
      name: 'merge-pdf-web-app-8105-vitejs-uat',
      script: 'npm',
      args: 'run start:uat',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
