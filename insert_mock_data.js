const { Pool } = require('pg');
require('dotenv').config();

async function insertMockData() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const client = await pool.connect();
    const mockSession = {
      username: "Test User",
      email: "testuser@example.com",
      country: "Nigeria",
      accessToken: "mock_access_token_12345",
      refreshToken: "mock_refresh_token_67890",
      idToken: "mock_id_token_abcde",
      rawResponse: JSON.stringify({ status: "success", mock: true }),
    };

    await client.query(
      'INSERT INTO auth_sessions (username, email, country, access_token, refresh_token, id_token, raw_response) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [mockSession.username, mockSession.email, mockSession.country, mockSession.accessToken, mockSession.refreshToken, mockSession.idToken, mockSession.rawResponse]
    );
    
    console.log('Successfully inserted mock authentication record into database.');
    client.release();
  } catch (err) {
    console.error('Error inserting mock data:', err);
  } finally {
    await pool.end();
  }
}

insertMockData();
