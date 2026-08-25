#!/bin/sh
set -e

# Migrations are idempotent and advisory-locked, so running them on every start
# is safe even if the service is ever scaled past one task.
node scripts/migrate.mjs

# exec so the Node server is PID 1 and receives SIGTERM directly — otherwise ECS
# waits out the stop timeout on every deploy.
exec node server.js
