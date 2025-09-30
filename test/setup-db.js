const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupTestDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_DATABASE}_test`);
  await connection.query(`USE ${process.env.DB_DATABASE}_test`);
  

  await connection.end();
  console.log('Test database setup complete');
}

setupTestDatabase().catch(err => {
  console.error('Error setting up test database:', err);
  process.exit(1);
});