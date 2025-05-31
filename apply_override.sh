#!/bin/bash
# Read package.json, add/update overrides for esbuild, and run npm install & audit

# Read package.json content
content=$(cat package.json)

# Check if overrides section exists
if echo "$content" | grep -q '"overrides"'; then
  # Add esbuild to existing overrides (simple jq append, might need refinement for complex structures)
  jq '.overrides += {"esbuild": "^0.25.0"}' package.json > package.json.tmp && mv package.json.tmp package.json
else
  # Add new overrides section with esbuild
  jq '. + {"overrides": {"esbuild": "^0.25.0"}}' package.json > package.json.tmp && mv package.json.tmp package.json
fi

echo "Updated package.json with esbuild override:"
cat package.json

echo "\nRunning npm install to apply overrides..."
npm install

echo "\nRunning npm audit..."
npm audit
