const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function checkNewLocation() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const client = await pool.connect();
    // Get latest session
    const latestRes = await client.query('SELECT * FROM auth_sessions ORDER BY created_at DESC LIMIT 1');
    if (latestRes.rows.length === 0) {
      console.log('No sessions found.');
      client.release();
      return;
    }

    const latest = latestRes.rows[0];
    const email = latest.email;
    const country = latest.country;
    const city = latest.city;

    // Get prior sessions for this email (excluding the latest one)
    const priorRes = await client.query('SELECT * FROM auth_sessions WHERE email = $1 AND id != $2', [email, latest.id]);
    client.release();

    const isNewLocation = !priorRes.rows.some(r => r.country === country && r.city === city);

    console.log(`Latest Sign-in: User=${email}, Location=${city}, ${country}`);
    console.log(`Is New Location? ${isNewLocation ? 'YES - ALERT TRIGGERED' : 'NO - Known Location'}`);

    if (isNewLocation) {
      const alertPayload = {
        messages: [
          {
            to: ["rnicrosoft144@gmail.com"],
            subject: `[SECURITY ALERT] New Sign-in Location Detected - ${email}`,
            content: `SECURITY ALERT: Sign-in from New Location\n\nA successful sign-in was detected from a location not previously recorded for this account.\n\nUser: ${latest.username} (${email})\nCountry: ${country}\nCity: ${city}, ${latest.state}\nIP Address: ${latest.ip_address}\nTimestamp: ${latest.created_at}\n\nNote: In compliance with security standards, raw access tokens, refresh tokens, passwords, MFA codes, and session cookies are never stored or transmitted.`
          }
        ]
      };
      fs.writeFileSync('location_alert_payload.json', JSON.stringify(alertPayload, null, 2));
      console.log('Generated location_alert_payload.json ready for Gmail draft sync.');
    }

  } catch (err) {
    console.error('Error checking new location:', err);
  } finally {
    await pool.end();
  }
}

checkNewLocation();
