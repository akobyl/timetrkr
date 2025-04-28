#!/bin/bash

# This script renames the static/index.html file during development
# to prevent it from interfering with the Vue dev server

# Check if static/index.html exists
if [ -f static/index.html ]; then
  echo "Moving static/index.html to static/index.html.bak for development"
  mv static/index.html static/index.html.bak
  echo "Done. You can restore it with: mv static/index.html.bak static/index.html"
else
  echo "No static/index.html found, nothing to rename"
fi