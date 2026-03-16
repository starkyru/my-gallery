module.exports = {
  apps: [
    {
      name: 'gallery-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      autorestart: true,
      max_memory_restart: '512M',
    },
    {
      name: 'gallery-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3000',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      max_memory_restart: '512M',
    },
  ],
};
