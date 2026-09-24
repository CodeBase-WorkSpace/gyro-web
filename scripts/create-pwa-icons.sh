#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

DEFAULT_SOURCE="${FRONTEND_ROOT}/brand-src/11-luxury-obsidian.png"
SOURCE="${1:-${DEFAULT_SOURCE}}"

if ! command -v sips >/dev/null 2>&1; then
  echo "error: sips is required to resize PWA icons on macOS." >&2
  exit 1
fi

if [[ ! -f "${SOURCE}" ]]; then
  echo "error: source icon not found: ${SOURCE}" >&2
  exit 1
fi

PWA_DIR="${FRONTEND_ROOT}/public/icons/pwa"
APPLE_TOUCH_ICON="${FRONTEND_ROOT}/public/apple-touch-icon.png"

mkdir -p "${PWA_DIR}"

sips -z 192 192 "${SOURCE}" --out "${PWA_DIR}/icon-192.png" >/dev/null
sips -z 512 512 "${SOURCE}" --out "${PWA_DIR}/icon-512.png" >/dev/null
sips -z 192 192 "${SOURCE}" --out "${PWA_DIR}/maskable-192.png" >/dev/null
sips -z 512 512 "${SOURCE}" --out "${PWA_DIR}/maskable-512.png" >/dev/null
sips -z 180 180 "${SOURCE}" --out "${APPLE_TOUCH_ICON}" >/dev/null

echo "Generated PWA icons from ${SOURCE}"
echo "Updated:"
echo "- ${PWA_DIR}/icon-192.png"
echo "- ${PWA_DIR}/icon-512.png"
echo "- ${PWA_DIR}/maskable-192.png"
echo "- ${PWA_DIR}/maskable-512.png"
echo "- ${APPLE_TOUCH_ICON}"
