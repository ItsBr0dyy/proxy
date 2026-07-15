#!/bin/bash

set -e

echo "Pulling latest commits"
git pull origin main

echo "Rebuilding container"
docker compose up -d --build

echo "Container is up to date"