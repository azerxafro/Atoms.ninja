/**
 * PM2 Ecosystem Configuration — Atoms Ninja Arsenal
 * Manages atoms-server + kali-mcp-server inside Docker container
 */

module.exports = {
  apps: [
    {
      name: 'atoms-server',
      script: 'atoms-server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        ATOMS_DOCKER: 'true',
      },
      error_file: '/var/log/atoms/atoms-server-error.log',
      out_file: '/var/log/atoms/atoms-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 5000,
    },
    {
      name: 'kali-mcp-server',
      script: 'kali-mcp-server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        KALI_MCP_PORT: 3002,
        ATOMS_DOCKER: 'true',
      },
      error_file: '/var/log/atoms/kali-mcp-error.log',
      out_file: '/var/log/atoms/kali-mcp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 5000,
    },
  ],
};
