const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  const schemaPath = path.join(__dirname, 'schema.sql');
  let schemaSQL = await fs.readFile(schemaPath, 'utf8');
  
  // Replace database name placeholder
  schemaSQL = schemaSQL.replace(/\{\{DB_DATABASE\}\}/g, process.env.DB_DATABASE);

  // Split the SQL file into individual statements and execute them
  const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
  for (const statement of statements) {
    await connection.query(statement);
  }

  await connection.end();
  console.log('Database setup complete');
}

setupDatabase().catch(err => {
  console.error('Error setting up database:', err);
  process.exit(1);
});