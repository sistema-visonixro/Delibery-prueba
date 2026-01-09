#!/usr/bin/env sh
# Copia los hooks versionados a .git/hooks y les da permiso de ejecución
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GITHOOKS_DIR="$REPO_ROOT/githooks"
TARGET_DIR="$REPO_ROOT/.git/hooks"

if [ ! -d "$TARGET_DIR" ]; then
  echo "No se encontró .git/hooks — ¿estás en un repositorio git?" >&2
  exit 0
fi

echo "Instalando git hooks desde $GITHOOKS_DIR -> $TARGET_DIR"
for f in "$GITHOOKS_DIR"/*; do
  [ -f "$f" ] || continue
  base=$(basename "$f")
  cp -f "$f" "$TARGET_DIR/$base"
  chmod +x "$TARGET_DIR/$base"
  echo "Instalado: $base"
done

echo "Hooks instalados." 
