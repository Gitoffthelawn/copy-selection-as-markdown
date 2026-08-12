#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../../../.." && pwd)"
target="${1:-all}"

case "$target" in
  all) browsers=(chromium firefox) ;;
  chromium | firefox) browsers=("$target") ;;
  *) echo "Usage: $0 [all|chromium|firefox]" >&2; exit 2 ;;
esac

for command in Xvfb chromium firefox-esr fluxbox xdotool xclip python3 pnpm; do
  command -v "$command" >/dev/null || {
    echo "Required command not found: $command" >&2
    exit 1
  }
done

cd "$repo_root"
pnpm build

run_browser() (
  local browser="$1"
  local temp_dir display_file display_number display port xvfb_pid fluxbox_pid server_pid browser_pid window_id clipboard result
  temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/copy-selection-as-markdown-${browser}.XXXXXX")"
  display_file="$temp_dir/display"
  result=1

  cleanup() {
    pkill -TERM -P "${browser_pid:-0}" 2>/dev/null || true
    kill "${browser_pid:-}" "${server_pid:-}" "${fluxbox_pid:-}" "${xvfb_pid:-}" 2>/dev/null || true
    (( result == 0 )) && rm -rf "$temp_dir"
  }
  trap cleanup EXIT

  Xvfb -displayfd 3 -screen 0 1280x900x24 -ac -nolisten tcp 3>"$display_file" \
    >"$temp_dir/xvfb.log" 2>&1 &
  xvfb_pid=$!
  for _ in {1..50}; do
    [[ -s "$display_file" ]] && break
    sleep 0.1
  done
  display_number="$(cat "$display_file")"
  display=":$display_number"

  DISPLAY="$display" fluxbox >"$temp_dir/fluxbox.log" 2>&1 &
  fluxbox_pid=$!
  sleep 0.5

  port="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')"
  python3 -m http.server "$port" --bind 127.0.0.1 --directory "$script_dir" \
    >"$temp_dir/http.log" 2>&1 &
  server_pid=$!

  if [[ "$browser" == chromium ]]; then
    DISPLAY="$display" chromium \
      --user-data-dir="$temp_dir/profile" \
      --disable-background-networking \
      --disable-component-update \
      --disable-default-apps \
      --disable-features=Translate \
      --disable-sync \
      --load-extension="$repo_root/packages/chromium/dist" \
      --no-first-run \
      --no-default-browser-check \
      "http://127.0.0.1:$port/fixture.html" \
      >"$temp_dir/browser.log" 2>&1 &
  else
    DISPLAY="$display" pnpm exec web-ext run \
      --source-dir packages/firefox/dist \
      --target firefox-desktop \
      --firefox "$(command -v firefox-esr)" \
      --no-reload \
      --no-input \
      --start-url "http://127.0.0.1:$port/fixture.html" \
      >"$temp_dir/browser.log" 2>&1 &
  fi
  browser_pid=$!

  window_id=""
  for _ in {1..100}; do
    if [[ "$browser" == chromium ]]; then
      window_id="$(DISPLAY="$display" xdotool search --onlyvisible --class chromium 2>/dev/null | tail -1 || true)"
    else
      window_id="$(DISPLAY="$display" xdotool search --onlyvisible --class firefox 2>/dev/null | tail -1 || true)"
    fi
    if [[ -n "$window_id" ]] &&
      [[ "$(DISPLAY="$display" xdotool getwindowname "$window_id" 2>/dev/null || true)" == *"Browser extension E2E"* ]]; then
      break
    fi
    window_id=""
    sleep 0.1
  done
  if [[ -z "$window_id" ]]; then
    echo "$browser: browser window did not open; logs: $temp_dir" >&2
    return 1
  fi

  DISPLAY="$display" xdotool windowactivate --sync "$window_id"
  DISPLAY="$display" xdotool windowsize "$window_id" 1280 900

  printf 'clipboard-sentinel' | DISPLAY="$display" xclip -selection clipboard
  DISPLAY="$display" xdotool mousemove --window "$window_id" 8 120 \
    mousedown 1 mousemove --sync --window "$window_id" 370 120 mouseup 1
  DISPLAY="$display" xdotool key --window "$window_id" shift+F10
  sleep 0.2
  if command -v import >/dev/null; then
    DISPLAY="$display" import -window root "$temp_dir/context-menu.png" 2>/dev/null || true
  fi
  if [[ "$browser" == chromium ]]; then
    DISPLAY="$display" xdotool key End Up Return
  else
    DISPLAY="$display" xdotool key End Return
  fi
  sleep 2
  clipboard="$(DISPLAY="$display" xclip -selection clipboard -o 2>/dev/null || true)"
  if [[ "$clipboard" == *"**formatted text**"* && "$clipboard" == *"[example link](https://example.com/)"* ]]; then
    echo "$browser: passed native context-menu clipboard test"
    result=0
    return 0
  fi

  if command -v import >/dev/null; then
    DISPLAY="$display" import -window root "$temp_dir/failure.png" 2>/dev/null || true
  fi
  echo "$browser: expected Markdown was not copied; logs: $temp_dir" >&2
  echo "Clipboard: $clipboard" >&2
  return 1
)

for browser in "${browsers[@]}"; do
  run_browser "$browser"
done
