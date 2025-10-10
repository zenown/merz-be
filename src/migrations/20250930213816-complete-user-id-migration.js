module.exports = {
  async up(dbService) {
    // Check if the columns exist before trying to rename them
    const usersStructure = await dbService.query("DESCRIBE users");
    const columnNames = usersStructure.map(col => col.Field);
    
    console.log('Current users table columns:', columnNames);
    
    // Only rename columns if they exist
    if (columnNames.includes('id_new')) {
      console.log('Renaming id_new to id...');
      await dbService.query(`
        ALTER TABLE users 
        CHANGE COLUMN id_new id CHAR(36) NOT NULL
      `);
    } else {
      console.log('id_new column does not exist, skipping...');
    }

    if (columnNames.includes('createdById_new')) {
      console.log('Renaming createdById_new to createdById...');
      await dbService.query(`
        ALTER TABLE users 
        CHANGE COLUMN createdById_new createdById CHAR(36) NULL
      `);
    } else {
      console.log('createdById_new column does not exist, skipping...');
    }

    if (columnNames.includes('updatedById_new')) {
      console.log('Renaming updatedById_new to updatedById...');
      await dbService.query(`
        ALTER TABLE users 
        CHANGE COLUMN updatedById_new updatedById CHAR(36) NULL
      `);
    } else {
      console.log('updatedById_new column does not exist, skipping...');
    }
    
    console.log('Migration completed successfully');
  },
  
  async down(dbService) {
    // This migration is not easily reversible due to data loss
    throw new Error('This migration cannot be reversed automatically. Please restore from backup.');
  }
};
