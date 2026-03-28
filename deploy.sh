#!/bin/bash
# QuizCraft Deploy Script
# Fixes stale .vercel project linking by force re-linking on each deploy.
# Usage: ./deploy.sh

set -e

PROJECT_NAME="quizcraft-app"

echo "=== QuizCraft Deploy ==="
echo "Removing stale .vercel project link..."
rm -rf .vercel

echo "Deploying to Vercel as '$PROJECT_NAME'..."
npx vercel deploy --prod --yes --name "$PROJECT_NAME" 2>&1 | tee deploy.log

if [ $? -ne 0 ]; then
    echo ""
    echo "Deploy failed. Retrying with fresh link..."
    sleep 10
    rm -rf .vercel
    npx vercel deploy --prod --yes --name "$PROJECT_NAME" 2>&1 | tee deploy.log
fi

echo ""
echo "=== Deploy complete ==="
