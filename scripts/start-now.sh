#!/usr/bin/env bash
set -euo pipefail
ROOT="/Users/amp/Projects/MySoceity"
LOG_DIR="$ROOT/.logs"
PID_DIR="$ROOT/.pids"
mkdir -p "$LOG_DIR" "$PID_DIR"

for p in 4200 4201 4202 4203 4400 8001 8002 8081 8082; do
  lsof -ti tcp:$p | xargs kill -9 2>/dev/null || true
done

find "$ROOT" -maxdepth 5 -name package.json -not -path "*/node_modules/*" -not -path "*/.git/*" | while read -r pkg; do
  dir="$(dirname "$pkg")"
  cd "$dir"
  if node -e "p=require('./package.json');process.exit(p.scripts&&p.scripts.dev?0:1)" 2>/dev/null; then
    [ -d node_modules ] || ( [ -f package-lock.json ] && npm ci || npm install )
    name="$(echo "$dir" | sed 's|/|_|g')"
    nohup npm run dev > "$LOG_DIR/${name}.log" 2>&1 &
    echo $! > "$PID_DIR/${name}.pid"
  elif node -e "p=require('./package.json');process.exit(p.scripts&&p.scripts.start?0:1)" 2>/dev/null; then
    [ -d node_modules ] || ( [ -f package-lock.json ] && npm ci || npm install )
    name="$(echo "$dir" | sed 's|/|_|g')"
    nohup npm run start > "$LOG_DIR/${name}.log" 2>&1 &
    echo $! > "$PID_DIR/${name}.pid"
  fi
done

echo "Started. Logs: $LOG_DIR"
