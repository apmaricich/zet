#!/bin/bash
set -e

echo "Building zet..."
npm run build

echo "Installing zet globally..."
npm install -g .

echo "Done! zet v$(node -p "require('./package.json').version") is ready to use."