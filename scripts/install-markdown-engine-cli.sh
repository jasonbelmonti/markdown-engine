#!/usr/bin/env sh
set -eu

VERSION="3.2.0"
PACKAGE="@jasonbelmonti/markdown-engine"
EXPECTED_SHA256="5033d08160fcd3f44b11498dc29d01db73d7aff2a55eb3257fd9a1c14e29c3f6"
DEFAULT_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
MARKDOWN_ENGINE_HOME="${MARKDOWN_ENGINE_HOME:-$DEFAULT_DATA_HOME/markdown-engine}"
MARKDOWN_ENGINE_BIN_DIR="${MARKDOWN_ENGINE_BIN_DIR:-$HOME/.local/bin}"
INSTALL_DIR="$MARKDOWN_ENGINE_HOME/tools/markdown-engine/$VERSION"
INSTALL_CLI="$INSTALL_DIR/markdown-engine-cli.mjs"
BIN_DIR="$MARKDOWN_ENGINE_BIN_DIR"
BIN_PATH="$BIN_DIR/markdown-engine"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
LOCAL_CLI="$REPO_ROOT/dist-bundled/markdown-engine-cli.mjs"
PACKED_CLI_ENTRY="package/dist-bundled/markdown-engine-cli.mjs"
TMP_DIR=""
SOURCE_CLI=""

cleanup() {
  if [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ]; then
    rm -rf "$TMP_DIR"
  fi
}
trap cleanup EXIT HUP INT TERM

fail() {
  printf 'install-markdown-engine-cli: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

sha256_of() {
  shasum -a 256 "$1" | awk '{print $1}'
}

shell_quote() {
  printf "'"
  printf '%s' "$1" | sed "s/'/'\\\\''/g"
  printf "'"
}

has_expected_sha() {
  candidate_sha=$(sha256_of "$1")

  if [ "$candidate_sha" = "$EXPECTED_SHA256" ]; then
    return 0
  fi

  printf 'install-markdown-engine-cli: ignoring local CLI with unexpected SHA-256 for %s: %s\n' "$1" "$candidate_sha" >&2
  return 1
}

resolve_source_cli() {
  if [ -f "$LOCAL_CLI" ]; then
    if has_expected_sha "$LOCAL_CLI"; then
      SOURCE_CLI="$LOCAL_CLI"
      return 0
    fi
  fi

  require_command npm
  require_command tar

  TMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/markdown-engine-cli.XXXXXX")
  pack_file=$(npm pack "$PACKAGE@$VERSION" --ignore-scripts --pack-destination "$TMP_DIR" --silent)

  [ -n "$pack_file" ] || fail "npm pack did not return a tarball name"
  [ -f "$TMP_DIR/$pack_file" ] || fail "npm pack tarball not found: $TMP_DIR/$pack_file"

  tar -xzf "$TMP_DIR/$pack_file" -C "$TMP_DIR" "$PACKED_CLI_ENTRY" ||
    fail "packed CLI artifact not found in $PACKAGE@$VERSION"

  packed_cli="$TMP_DIR/$PACKED_CLI_ENTRY"
  [ -f "$packed_cli" ] || fail "packed CLI artifact not found in $PACKAGE@$VERSION"
  SOURCE_CLI="$packed_cli"
}

require_command shasum
require_command node
require_command sed

resolve_source_cli
source_cli="$SOURCE_CLI"
[ -n "$source_cli" ] || fail "unable to resolve bundled CLI source"
actual_sha=$(sha256_of "$source_cli")

if [ "$actual_sha" != "$EXPECTED_SHA256" ]; then
  fail "unexpected CLI SHA-256 for $source_cli: $actual_sha"
fi

mkdir -p "$INSTALL_DIR" "$BIN_DIR"
cp "$source_cli" "$INSTALL_CLI"
chmod 755 "$INSTALL_CLI"

quoted_install_cli=$(shell_quote "$INSTALL_CLI")
{
  printf '%s\n' '#!/usr/bin/env sh'
  printf 'DEFAULT_MARKDOWN_ENGINE_CLI=%s\n' "$quoted_install_cli"
  printf '%s\n' 'MARKDOWN_ENGINE_CLI="${MARKDOWN_ENGINE_CLI:-$DEFAULT_MARKDOWN_ENGINE_CLI}"'
  printf '%s\n' 'exec "${NODE_BINARY:-node}" "$MARKDOWN_ENGINE_CLI" "$@"'
} > "$BIN_PATH"
chmod 755 "$BIN_PATH"

"${NODE_BINARY:-node}" "$INSTALL_CLI" --help >/dev/null

printf 'Installed markdown-engine CLI: %s\n' "$INSTALL_CLI"
printf 'Installed markdown-engine wrapper: %s\n' "$BIN_PATH"
printf 'SHA-256: %s\n' "$actual_sha"
