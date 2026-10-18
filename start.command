#!/bin/zsh
set -eu
cd "$(dirname "$0")"
port="${PORT:-8000}"
printf 'e-Care Simulator: http://localhost:%s\n수정 후 브라우저를 새로고침하세요. 종료: Ctrl+C\n' "$port"
exec python3 -m http.server "$port" --bind 127.0.0.1
