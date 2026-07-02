#!/usr/bin/env bash
#
# Verify ONE pinned provider version against the contract.
#
#   scripts/verify-version.sh <npm-package> <version> [vitest-suite]
#
# Example:
#   scripts/verify-version.sh @openfeature/unleash-web-provider 0.1.0
#
# The provider under test is supplied by the environment: we pin the exact version
# (without touching package.json), run the suite, then restore the pinned deps.
# The server provider (@unleash/openfeature-node-provider) is not on npm yet — point
# its `file:` dependency at the build you want and use `npm run verify:server`.
set -uo pipefail

PKG="${1:?usage: verify-version.sh <package> <version> [suite]}"
VER="${2:?usage: verify-version.sh <package> <version> [suite]}"
SUITE="${3:-test/web-scenarios.test.ts}"

echo ">> pinning ${PKG}@${VER} (no-save)"
npm install "${PKG}@${VER}" --no-save --silent >/dev/null 2>&1

echo ">> running ${SUITE}"
npx vitest run "${SUITE}" 2>&1 | grep -E "Test Files|Tests |KNOWN GAP|FAIL" | sed 's/^ *//'
RC=${PIPESTATUS[0]}

echo ">> restoring pinned dependencies"
npm install --silent >/dev/null 2>&1
exit "${RC}"
