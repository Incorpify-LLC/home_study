#!/usr/bin/env bash
set -euo pipefail

version="8.30.1"
case "$(uname -s)-$(uname -m)" in
  Linux-x86_64)
    archive="gitleaks_${version}_linux_x64.tar.gz"
    expected="551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb"
    ;;
  Linux-aarch64|Linux-arm64)
    archive="gitleaks_${version}_linux_arm64.tar.gz"
    expected="e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080"
    ;;
  *)
    echo "Unsupported platform for the pinned gitleaks scanner." >&2
    exit 2
    ;;
esac

cache_dir="${TMPDIR:-/tmp}/home-study-gitleaks-${version}"
mkdir -p "$cache_dir"
binary="$cache_dir/gitleaks"
if [[ ! -x "$binary" ]]; then
  curl --fail --silent --show-error --location \
    "https://github.com/gitleaks/gitleaks/releases/download/v${version}/${archive}" \
    --output "$cache_dir/$archive"
  printf '%s  %s\n' "$expected" "$cache_dir/$archive" | sha256sum --check --status
  tar -xzf "$cache_dir/$archive" -C "$cache_dir" gitleaks
fi

exec "$binary" git --config .gitleaks.toml --redact --no-banner --verbose .
