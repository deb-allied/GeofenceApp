#!/usr/bin/env bash

# Exit on any error
set -o errexit

echo "🔧 Installing Poetry..."
curl -sSL https://install.python-poetry.org | python3 -

# Add Poetry to PATH
export PATH="$HOME/.local/bin:$PATH"

echo "📦 Installing dependencies with Poetry..."
poetry install --no-root

echo "✅ Build completed"
