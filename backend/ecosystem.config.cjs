const path = require('path');

module.exports = {
  apps: [
    // -------------------------------------------------------------
    // BACKEND HTTP / WEBSOCKET INSTANCES
    // -------------------------------------------------------------
    {
      name: 'ems-backend-1',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        INSTANCE_ID: 'backend-1'
      },
      error_file: './logs/ems-backend-1-error.log',
      out_file: './logs/ems-backend-1-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'ems-backend-2',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        INSTANCE_ID: 'backend-2'
      },
      error_file: './logs/ems-backend-2-error.log',
      out_file: './logs/ems-backend-2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'ems-backend-3',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5002,
        INSTANCE_ID: 'backend-3'
      },
      error_file: './logs/ems-backend-3-error.log',
      out_file: './logs/ems-backend-3-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'ems-backend-4',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5003,
        INSTANCE_ID: 'backend-4'
      },
      error_file: './logs/ems-backend-4-error.log',
      out_file: './logs/ems-backend-4-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },

    // -------------------------------------------------------------
    // ASYNC BULLMQ WORKERS
    // -------------------------------------------------------------
    {
      name: 'ems-worker-1',
      script: 'src/workers/start-workers.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WORKER_ID: 'worker-1'
      },
      error_file: './logs/ems-worker-1-error.log',
      out_file: './logs/ems-worker-1-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      max_memory_restart: '512M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'ems-worker-2',
      script: 'src/workers/start-workers.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WORKER_ID: 'worker-2'
      },
      error_file: './logs/ems-worker-2-error.log',
      out_file: './logs/ems-worker-2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      max_memory_restart: '512M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
