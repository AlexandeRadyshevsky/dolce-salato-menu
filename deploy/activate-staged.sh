#!/usr/bin/env bash
set -Eeuo pipefail

release="$(cd -- "${1:?usage: bash activate-staged.sh RELEASE_DIRECTORY}" && pwd)"
incoming="$release/revision2"
site=/var/www/dolcesalato
nginx=/etc/nginx/sites-available/dolcesalato
candidate="$release/nginx-dolcesalato.candidate"
for file in "$candidate" "$incoming/server/src/catalog.js" "$incoming/server/admin/index.html" \
  "$incoming/src/data/menu.json" "$incoming/dist/_redirects.nginx"; do
  test -s "$file"
done

sudo -v
backup="$(mktemp -d "$release/before-activation.XXXXXXXX")"
cp -a "$site/server/src" "$backup/api-src"
cp -a "$site/server/admin/index.html" "$backup/admin.html"
cp -a "$site/src/data/menu.json" "$backup/menu.json"
cp -a "$site/dist/_redirects.nginx" "$backup/redirects.nginx"
cp -a "$nginx" "$backup/nginx.conf"

rollback() {
  status=$?
  trap - ERR
  set +e
  printf 'Activation failed. Restoring files from %s\n' "$backup" >&2
  rsync -a "$backup/api-src/" "$site/server/src/"
  cp -a "$backup/admin.html" "$site/server/admin/index.html"
  cp -a "$backup/menu.json" "$site/src/data/menu.json"
  cp -a "$backup/redirects.nginx" "$site/dist/_redirects.nginx"
  sudo -n install -m 644 "$backup/nginx.conf" "$nginx"
  sudo -n systemctl restart dolcesalato-api.service
  sudo -n nginx -t && sudo -n systemctl reload nginx.service
  exit "$status"
}

python3 - "$backup/nginx.conf" "$candidate" <<'PY'
from pathlib import Path
import sys

live, candidate = (Path(name).read_text() for name in sys.argv[1:])
old = "    rewrite ^/katalog/?$ /catalog/ permanent;\n    rewrite ^/katalog/(.*)$ /catalog/$1 permanent;"
new = (
    "    location = /katalog { return 301 /catalog/$is_args$args; }\n"
    "    location = /katalog/ { return 301 /catalog/$is_args$args; }\n"
    "    location ~ ^/katalog/(.+?)/?$ { return 301 /catalog/$1/$is_args$args; }"
)
if live.count(old) != 1 or live.replace(old, new) != candidate:
    raise SystemExit("The live nginx config has changed. Review the candidate before activating.")
PY

trap rollback ERR
rsync -a --delay-updates "$incoming/server/src/" "$site/server/src/"
install -m 644 "$incoming/server/admin/index.html" "$site/server/admin/index.html"
install -m 644 "$incoming/src/data/menu.json" "$site/src/data/menu.json"
install -m 644 "$incoming/dist/_redirects.nginx" "$site/dist/_redirects.nginx"
sudo -n install -m 644 "$candidate" "$nginx"
sudo -n nginx -t
sudo -n systemctl restart dolcesalato-api.service
wait_for_catalog() {
  local attempt
  for attempt in {1..15}; do
    if curl --noproxy '*' -fs --connect-timeout 1 --max-time 2 \
      http://127.0.0.1:3001/api/catalog >/dev/null; then
      return 0
    fi
    if (( attempt < 15 )); then
      sleep 1
    fi
  done
  printf 'API did not become ready at 127.0.0.1:3001/api/catalog\n' >&2
  sudo -n journalctl -u dolcesalato-api.service -n 25 --no-pager >&2 || true
  return 1
}
wait_for_catalog
sudo -n systemctl reload nginx.service

old='/katalog/olivkovoe-maslo/olivkovoe-maslo-pervogo-otzhima-buyo-optom/?utm_source=deploy-check'
expected='/catalog/olivkovoe-maslo/olivkovoe-maslo-extra-virgin-buio-optom/?utm_source=deploy-check'
verify_redirect() {
  local attempt headers status location
  for attempt in {1..10}; do
    headers="$(curl --noproxy '*' -sSI --max-time 3 \
      --resolve dolcesalato.ru:443:127.0.0.1 "https://dolcesalato.ru$old")" || headers=''
    status="$(awk 'NR == 1 { print $2 }' <<<"$headers")"
    location="$(tr -d '\r' <<<"$headers" | awk 'tolower($1) == "location:" { print $2 }')"
    if [[ "$status" == 301 && ( "$location" == "$expected" || "$location" == "https://dolcesalato.ru$expected" ) ]]; then
      return 0
    fi
    if (( attempt < 10 )); then
      sleep 1
    fi
  done
  printf 'Redirect check failed: HTTP %s, Location: %s; expected 301 to %s\n' \
    "${status:-unavailable}" "${location:-missing}" "$expected" >&2
  return 1
}
printf 'API is ready. Checking nginx redirect.\n'
verify_redirect
trap - ERR
printf 'Editor and nginx redirects active. Backup: %s\n' "$backup"
