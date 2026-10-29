module.exports = {
  apps: [
    {
      name: 'iam-games',
      script: 'npx',
      args: 'tsx server.ts',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      max_memory_restart: '512M',
    },
  ],
}
