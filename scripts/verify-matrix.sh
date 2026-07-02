#!/usr/bin/env bash
#
# Run the contract across a MATRIX of provider versions and print a compatibility table.
#
#   scripts/verify-matrix.sh [version ...]
#
# With no args it verifies every published version of the web provider. The pass/gap
# set per version IS the compatibility matrix. A version that turns the suite RED is a
# signal: either a regression, or a previously-tracked knownGap got FIXED (its `it.fails`
# flips) — both are things to look at.
set -uo pipefail

PKG="@openfeature/unleash-web-provider"
SUITE="test/web-scenarios.test.ts"

if [ "$#" -gt 0 ]; then
  VERSIONS=("$@")
else
  mapfile -t VERSIONS < <(npm view "$PKG" versions --json | tr -d '[]"' | tr ',' '\n' | sed 's/ //g')
fi

echo "Provider : $PKG"
echo "Suite    : $SUITE"
echo
printf '%-10s | %-6s | %s\n' "version" "suite" "tests"
printf -- '-----------|--------|---------------------------\n'

for V in "${VERSIONS[@]}"; do
  [ -z "$V" ] && continue
  npm install "${PKG}@${V}" --no-save --silent >/dev/null 2>&1
  OUT=$(npx vitest run "$SUITE" 2>&1)
  TESTS=$(echo "$OUT" | grep -E "^\s*Tests " | tail -1 | sed 's/^ *//')
  if echo "$OUT" | grep -qE "Test Files.*failed|✗|Tests.*failed"; then RES="RED"; else RES="green"; fi
  printf '%-10s | %-6s | %s\n' "$V" "$RES" "${TESTS:-no summary}"
done

echo
npm install --silent >/dev/null 2>&1
echo "(restored pinned dependencies)"
