module.exports = {
  apps: [
    {
      name: 'trade-compliance-web-app-8097-vitejs-uat',
      script: 'npm',
      args: 'run start:uat',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
