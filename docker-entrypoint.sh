#!/bin/sh
# Starts the app. With LITESTREAM_BUCKET set, the database is continuously
# backed up by Litestream (litestream.yml), and an empty volume is first
# restored from the latest backup. Without it, the app runs as before.
set -e

if [ -z "$LITESTREAM_BUCKET" ]; then
  exec node apps/web/server.js
fi

export LITESTREAM_PATH="${LITESTREAM_PATH:-journal}"
DB="$JOURNAL_DATA_DIR/journal.db"
mkdir -p "$JOURNAL_DATA_DIR"

# Only ever restores onto an empty volume; an existing database is never
# overwritten. If a backup exists but can't be read (e.g. wrong keys), this
# fails and the app doesn't start, rather than starting empty.
litestream restore -config /etc/litestream.yml -if-db-not-exists -if-replica-exists "$DB"

exec litestream replicate -config /etc/litestream.yml -exec "node apps/web/server.js"
