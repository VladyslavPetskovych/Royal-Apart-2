#!/bin/bash
echo "Starting Flask prediction server..."
cd "$(dirname "$0")"
python3 predict_server.py

