#!/usr/bin/env bash

# this script should be invoked from the repo root

get_files_to_update() {
  find ./packages \
    -maxdepth 3 \
    -type f \
    -not -path "./packages/node_modules/*" \
    -exec grep -l 'use-example' '{}' ';'
}
show_diff() {
  if command -v code &>/dev/null; then
    code --diff "$@"
  else
    diff -u "$@"
  fi
}
is_interactive() {
  test -t 1 # stdout (device 1) is a tty
}
for f in $(get_files_to_update); do
  node ./scripts/include.js "$f" > /tmp/updated
  show_diff "$f" /tmp/updated
  if is_interactive; then
    printf "Accept changes to %s [Y/n]?" "$f";
    read -r accept;
    case "$accept" in
      "" | "Y" | "y") ;;
      *) exit 1 ;;
    esac
  fi
  cat /tmp/updated > "$f"
done
