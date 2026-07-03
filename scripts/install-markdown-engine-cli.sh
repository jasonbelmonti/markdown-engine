#!/usr/bin/env sh
set -eu

VERSION="${MARKDOWN_ENGINE_VERSION:-3.0.0}"
PACKAGE="@jasonbelmonti/markdown-engine"
EXPECTED_SHA256="f61ab59e28eb92cccf4fd8073c090102e67a9397a7f0d208661ded14b879053d"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
INSTALL_DIR="$CODEX_HOME/tools/markdown-engine/$VERSION"
INSTALL_CLI="$INSTALL_DIR/markdown-engine-cli.mjs"
BIN_DIR="$CODEX_HOME/bin"
BIN_PATH="$BIN_DIR/markdown-engine"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
LOCAL_CLI="$REPO_ROOT/dist-bundled/markdown-engine-cli.mjs"
TMP_DIR=""

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

resolve_source_cli() {
  if [ -f "$LOCAL_CLI" ]; then
    printf '%s\n' "$LOCAL_CLI"
    return 0
  fi

  require_command npm
  require_command tar

  TMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/markdown-engine-cli.XXXXXX")
  pack_file=$(npm pack "$PACKAGE@$VERSION" --ignore-scripts --pack-destination "$TMP_DIR" --silent)

  [ -n "$pack_file" ] || fail "npm pack did not return a tarball name"
  [ -f "$TMP_DIR/$pack_file" ] || fail "npm pack tarball not found: $TMP_DIR/$pack_file"

  tar -xzf "$TMP_DIR/$pack_file" -C "$TMP_DIR"

  packed_cli="$TMP_DIR/package/dist-bundled/markdown-engine-cli.mjs"
  [ -f "$packed_cli" ] || fail "packed CLI artifact not found in $PACKAGE@$VERSION"
  printf '%s\n' "$packed_cli"
}

require_command shasum
require_command node

source_cli=$(resolve_source_cli)
actual_sha=$(sha256_of "$source_cli")

if [ "$actual_sha" != "$EXPECTED_SHA256" ]; then
  fail "unexpected CLI SHA-256 for $source_cli: $actual_sha"
fi

mkdir -p "$INSTALL_DIR" "$BIN_DIR"
cp "$source_cli" "$INSTALL_CLI"
chmod 755 "$INSTALL_CLI"

cat > "$BIN_PATH" <<'EOF'
#!/usr/bin/env sh
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
MARKDOWN_ENGINE_CLI="${MARKDOWN_ENGINE_CLI:-$CODEX_HOME/tools/markdown-engine/3.0.0/markdown-engine-cli.mjs}"
exec "${NODE_BINARY:-node}" "$MARKDOWN_ENGINE_CLI" "$@"
EOF
chmod 755 "$BIN_PATH"

"${NODE_BINARY:-node}" "$INSTALL_CLI" --help >/dev/null

printf 'Installed markdown-engine CLI: %s\n' "$INSTALL_CLI"
printf 'Installed markdown-engine wrapper: %s\n' "$BIN_PATH"
printf 'SHA-256: %s\n' "$actual_sha"
