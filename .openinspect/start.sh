#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="${OPENINSPECT_START_LOG:-/tmp/openinspect-grails-market.log}"
PID_FILE="${OPENINSPECT_START_PID:-/tmp/openinspect-grails-market.pid}"
PORT="${PORT:-3000}"

echo "Starting Grails app for OPENINSPECT_BOOT_MODE=${OPENINSPECT_BOOT_MODE:-unknown}"

port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :$PORT" 2>/dev/null | grep -q LISTEN
  elif command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1
  elif command -v netstat >/dev/null 2>&1; then
    netstat -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$PORT$"
  else
    # Last resort: try to bind via bash's /dev/tcp (checks if something accepts)
    (exec 3<>/dev/tcp/127.0.0.1/"$PORT") 2>/dev/null && { exec 3<&-; exec 3>&-; return 0; } || return 1
  fi
}

if port_in_use; then
  echo "Grails app is already running on port $PORT"
  exit 0
fi

# Stale pid file (e.g. after snapshot/resume) — clean it up
if [ -f "$PID_FILE" ]; then
  rm -f "$PID_FILE"
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