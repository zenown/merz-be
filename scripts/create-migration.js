// scripts/create-migration.js
const fs = require('fs');
const path = require('path');

const migrationName = process.argv[2];
if (!migrationName) {
  console.error('Please provide a migration name');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
const fileName = `${timestamp}-${migrationName}.js`;
const migrationsDir = path.join(__dirname, '../src/migrations');

// Ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const template = `module.exports = {
  async up(dbService) {
    // Write your migration here
    await dbService.query(\`
      -- SQL statements for migrating up
    \`);
  },
  
  async down(dbService) {
    // Write how to revert the migration here
    await dbService.query(\`
      -- SQL statements for migrating down
    \`);
  }
};
`;

fs.writeFileSync(path.join(migrationsDir, fileName), template);
console.log(`Migration file created: ${fileName}`);