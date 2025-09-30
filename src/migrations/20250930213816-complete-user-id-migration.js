module.exports = {
  async up(dbService) {
    // Complete the migration by renaming the new columns to the original names
    // First rename id_new to id (keeping the existing primary key)
    await dbService.query(`
      ALTER TABLE users 
      CHANGE COLUMN id_new id CHAR(36) NOT NULL
    `);

    // Rename the other columns
    await dbService.query(`
      ALTER TABLE users 
      CHANGE COLUMN createdById_new createdById CHAR(36) NULL
    `);

    await dbService.query(`
      ALTER TABLE users 
      CHANGE COLUMN updatedById_new updatedById CHAR(36) NULL
    `);
  },
  
  async down(dbService) {
    // This migration is not easily reversible due to data loss
    throw new Error('This migration cannot be reversed automatically. Please restore from backup.');
  }
};
