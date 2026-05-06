#!/usr/bin/env bash
set -euo pipefail

cd /workspaces/VRCI-Dashboard

if [ ! -f .env.local ]; then
  cp env.example .env.local
  echo "Created .env.local from env.example."
fi

npm install --no-package-lock
npx prisma generate

echo
echo "Devcontainer setup complete."
echo "Next steps:"
echo "  1. npx prisma migrate deploy"
echo "  2. bunx prisma db seed   # optional"
echo "  3. npm run dev"
