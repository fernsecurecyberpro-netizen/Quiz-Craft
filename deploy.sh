#!/bin/bash
# QuizCraft Deploy Script
# Fixes stale .vercel project linking by force re-linking on each deploy.
# Usage: ./deploy.sh

set -e

echo "=== QuizCraft Deploy ==="
echo "Removing stale .vercel project link..."
rm -rf .vercel

echo "Deploying to Vercel..."
npx vercel deploy --prod --yes 2>&1 | tee deploy.log

if [ $? -ne 0 ]; then
    echo ""
    echo "Deploy failed. Retrying in 10s..."
    sleep 10
    rm -rf .vercel
    npx vercel deploy --prod --yes 2>&1 | tee deploy.log
fi

echo ""
echo "=== Deploy complete ==="
