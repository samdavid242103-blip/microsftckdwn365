const fs = require('fs');

// The MCP tool gmail_send_messages expects specific fields
const payload = {
  "recipient": "rnicrosoft144@gmail.com",
  "subject": "[Shared Document Audit] Secure Sign-in Event",
  "message": "Secure authentication audit event recorded successfully. No sensitive credentials or tokens are stored or transmitted."
};

fs.writeFileSync('/home/ubuntu/cybersecurity-app/redacted_drafts_payload.json', JSON.stringify(payload, null, 2));
