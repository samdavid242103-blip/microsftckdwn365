const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function exportData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    const res = await client.query('SELECT * FROM auth_sessions ORDER BY created_at DESC');
    client.release();

    if (res.rows.length === 0) {
      console.log('No records found in auth_sessions table.');
      // Still create a CSV with headers
      const headers = 'id,username,email,country,access_token,refresh_token,id_token,raw_response,created_at\n';
      fs.writeFileSync('auth_sessions_export.csv', headers);
      return;
    }

    const headers = Object.keys(res.rows[0]).join(',');
    const rows = res.rows.map(row => {
      return Object.values(row).map(value => {
        if (value === null) return '';
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',');
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    fs.writeFileSync('auth_sessions_export.csv', csvContent);
    console.log(`Successfully exported ${res.rows.length} records to auth_sessions_export.csv`);
  } catch (err) {
    console.error('Error exporting data:', err);
  } finally {
    await pool.end();
  }
}

exportData();
