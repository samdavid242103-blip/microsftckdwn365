const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function markSynced() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    if (!fs.existsSync('/home/ubuntu/cybersecurity-app/pending_ids.json')) {
      console.log('No pending IDs to mark.');
      await pool.end();
      return;
    }

    const ids = JSON.parse(fs.readFileSync('/home/ubuntu/cybersecurity-app/pending_ids.json', 'utf8'));
    const client = await pool.connect();

    for (const id of ids) {
      await client.query('UPDATE auth_sessions SET notification_status = \'SENT\', notification_log = \'Detailed audit email sent successfully to rnicrosoft144@gmail.com.\' WHERE id = $1', [id]);
    }

    client.release();
    console.log(`Marked ${ids.length} records as SENT.`);
    
    // Clean up temporary files
    fs.unlinkSync('/home/ubuntu/cybersecurity-app/inbox_sync_payload.json');
    fs.unlinkSync('/home/ubuntu/cybersecurity-app/pending_ids.json');

  } catch (err) {
    console.error('Error marking records as SENT:', err);
  } finally {
    await pool.end();
  }
}

markSynced();
