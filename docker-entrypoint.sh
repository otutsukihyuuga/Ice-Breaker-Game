#!/bin/sh
set -e
npx prisma db push
npx prisma db seed
exec node server.mjs
