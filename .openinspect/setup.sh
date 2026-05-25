#!/usr/bin/env bash
set -euo pipefail

echo "Running Grails app setup for OPENINSPECT_BOOT_MODE=${OPENINSPECT_BOOT_MODE:-unknown}"

bun install
