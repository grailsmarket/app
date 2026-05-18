#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="${OPENINSPECT_START_LOG:-/tmp/openinspect-grails-market.log}"
PID_FILE="${OPENINSPECT_START_PID:-/tmp/openinspect-grails-market.pid}"
PORT="${PORT:-3000}"

echo "Starting Grails app for OPENINSPECT_BOOT_MODE=${OPENINSPECT_BOOT_MODE:-unknown}"

if [ -f "$PID_FILE" ]; then
  EXISTING_PID="$(cat "$PID_FILE")"
  if [ -n "$EXISTING_PID" ] && kill -0 "$EXISTING_PID" 2>/dev/null; then
    echo "Grails app is already running with PID $EXISTING_PID"
    exit 0
  fi
fi

if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then
  cp .env.example .env.local
fi

nohup bun run dev --hostname 0.0.0.0 --port "$PORT" >"$LOG_FILE" 2>&1 &
APP_PID="$!"
echo "$APP_PID" >"$PID_FILE"

sleep 2

if ! kill -0 "$APP_PID" 2>/dev/null; then
  echo "Grails app failed to start. Logs: $LOG_FILE" >&2
  exit 1
fi

echo "Grails app started on port $PORT with PID $APP_PID. Logs: $LOG_FILE"
