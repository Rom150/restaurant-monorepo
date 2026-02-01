#!/bin/bash
set -e

# Test script for mock-parse-server
# Posts a PDF file to the parse endpoint and displays results

echo "Testing mock-parse-server..."
echo ""

# Check if server is running
if ! curl -s http://localhost:9000/parse > /dev/null 2>&1; then
    echo "ERROR: Server not responding on http://localhost:9000"
    echo "Please start the server with: npm start"
    exit 1
fi

# Find example PDF
PDF_FILE="../../frontend/mercuriale_example.pdf"
if [ ! -f "$PDF_FILE" ]; then
    echo "ERROR: Example PDF not found at $PDF_FILE"
    exit 1
fi

echo "Posting $PDF_FILE to http://localhost:9000/parse..."
echo ""

# Send request and capture response
RESPONSE=$(curl -s -i -F "file=@$PDF_FILE" http://localhost:9000/parse)

# Display response
echo "=== Response ==="
echo "$RESPONSE"
echo ""

# If log file exists, show recent entries
LOG_FILE="mock-parse-server.log"
if [ -f "$LOG_FILE" ]; then
    echo "=== Recent log entries ==="
    tail -n 20 "$LOG_FILE"
else
    echo "Note: No log file found at $LOG_FILE"
fi
