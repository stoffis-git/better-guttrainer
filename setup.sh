#!/bin/bash
# Setup script for Gut Training Protocol Generator

set -e

echo "🧹 Cleaning up..."
rm -rf node_modules
rm -rf .next

echo "📦 Installing dependencies..."
npm install

echo "🧪 Running validation tests..."
npx tsx src/lib/validation.test.ts

echo ""
echo "✅ Setup complete!"
echo ""
echo "Run 'npm run dev' to start the development server"
echo "Open http://localhost:3000 to view the application"

