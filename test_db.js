const { Pool } = require('pg');
require('dotenv').config();

async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('Attempting to connect to:', process.env.DATABASE_URL);
    const client = await pool.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await pool.end();
  }
}
test();
