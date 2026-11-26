#!/usr/bin/env bash
# One PostgreSQL instance, one database + owner role per system (ADR-000 §3.6).
# Runs once, on an empty data volume. Passwords come from the container env, never from this file.
set -euo pipefail

create_database() {
  local name="$1" password="$2"
  psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
    -v name="$name" -v password="$password" <<'SQL'
CREATE ROLE :"name" LOGIN PASSWORD :'password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE :"name" OWNER :"name";
REVOKE ALL ON DATABASE :"name" FROM PUBLIC;
SQL
}

create_database lavin_migrator "$LAVIN_DB_PASSWORD"
psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c 'ALTER DATABASE lavin_migrator RENAME TO lavin'
create_database keycloak "$KEYCLOAK_DB_PASSWORD"
create_database flowable "$FLOWABLE_DB_PASSWORD"
create_database corteza "$CORTEZA_DB_PASSWORD"
create_database payload "$PAYLOAD_DB_PASSWORD"

# Extensions that need superuser; migrations use CREATE EXTENSION IF NOT EXISTS.
psql -v ON_ERROR_STOP=1 -U postgres -d lavin <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
SQL
