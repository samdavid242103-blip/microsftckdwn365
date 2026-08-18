#!/bin/bash
# Automated Sign-in Audit Sync Workflow
# This script is executed by the background scheduler.

set -e

APP_DIR="/home/ubuntu/cybersecurity-app"
PAYLOAD_FILE="$APP_DIR/inbox_sync_payload.json"

echo "[$(date)] Starting sync workflow..."

cd "$APP_DIR"

# 1. Run the sync script to generate the payload from PENDING database records
node sync_inbox_automatic.js

# 2. Check if a payload was generated
if [ -f "$PAYLOAD_FILE" ]; then
    echo "[$(date)] New sign-ins detected. Sending to Gmail..."
    
    # 3. Call the Gmail MCP tool to send the messages
    # Note: Using manus-mcp-cli which is available in the sandbox environment
    manus-mcp-cli tool call gmail_send_messages --server gmail --input-file "$PAYLOAD_FILE"
    
    # 4. Mark the records as SENT in the database
    node mark_synced.js
    
    # 5. Clean up the payload file
    rm "$PAYLOAD_FILE"
    
    echo "[$(date)] Sync completed successfully."
else
    echo "[$(date)] No new sign-ins found. Skipping Gmail delivery."
fi
