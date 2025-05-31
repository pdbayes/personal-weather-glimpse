#!/bin/bash
# Remove node_modules directory
if [ -d "node_modules" ]; then
  echo "Removing node_modules directory..."
  rm -rf node_modules
  echo "node_modules directory removed."
else
  echo "node_modules directory not found."
fi

# Remove package-lock.json file
if [ -f "package-lock.json" ]; then
  echo "Removing package-lock.json file..."
  rm -f package-lock.json
  echo "package-lock.json file removed."
else
  echo "package-lock.json file not found."
fi

# Remove bun.lockb file
if [ -f "bun.lockb" ]; then
  echo "Removing bun.lockb file..."
  rm -f bun.lockb
  echo "bun.lockb file removed."
else
  echo "bun.lockb file not found."
fi

echo "Cleanup complete."
