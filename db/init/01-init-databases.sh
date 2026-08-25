#!/bin/bash
# Runs once, on first Postgres container init (empty data dir), as the superuser.
#
# Creates one database + one dedicated role per service, so neither can read the
# other's data — the same isolation to enforce in RDS with separate roles.
#
#   naievedb   owned by naieve_app     — app_user mask, conversations, logs
#   keycloak   owned by keycloak       — realm config, users, sessions
#
# naieve_export is created here (roles are cluster-level, so a migration running
# as naieve_app could not create it) but is granted nothing until the Phase 3
# migration adds the transcript view. It must never be able to read app_user.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE ${NAIEVEDB_USER} LOGIN PASSWORD '${NAIEVEDB_PASSWORD}';
    CREATE DATABASE ${NAIEVEDB_NAME} OWNER ${NAIEVEDB_USER};

    CREATE ROLE ${NAIEVE_EXPORT_USER} LOGIN PASSWORD '${NAIEVE_EXPORT_PASSWORD}';

    CREATE ROLE ${KEYCLOAKDB_USER} LOGIN PASSWORD '${KEYCLOAKDB_PASSWORD}';
    CREATE DATABASE ${KEYCLOAKDB_NAME} OWNER ${KEYCLOAKDB_USER};

    -- Belt and suspenders: keep each service out of the other's database.
    REVOKE CONNECT ON DATABASE ${NAIEVEDB_NAME} FROM PUBLIC;
    REVOKE CONNECT ON DATABASE ${KEYCLOAKDB_NAME} FROM PUBLIC;
    GRANT  CONNECT ON DATABASE ${NAIEVEDB_NAME} TO ${NAIEVEDB_USER};
    GRANT  CONNECT ON DATABASE ${NAIEVEDB_NAME} TO ${NAIEVE_EXPORT_USER};
    GRANT  CONNECT ON DATABASE ${KEYCLOAKDB_NAME} TO ${KEYCLOAKDB_USER};
EOSQL

echo "Initialized databases: ${NAIEVEDB_NAME} (owner ${NAIEVEDB_USER}), ${KEYCLOAKDB_NAME} (owner ${KEYCLOAKDB_USER})"
