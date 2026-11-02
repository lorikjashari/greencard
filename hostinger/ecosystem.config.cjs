/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");

module.exports = {
  apps: [
    {
      name: "greencard",
      cwd: path.join(__dirname, ".."),
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        // Load the rest from .env.production on the server, e.g. via
        // `set -a; . .env.production; set +a` before `pm2 start`.
      },
    },
  ],
};
