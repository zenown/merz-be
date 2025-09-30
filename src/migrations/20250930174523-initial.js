module.exports = {
  async up(dbService) {
    await dbService.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        firstName VARCHAR(255),
        lastName VARCHAR(255),
        googleId VARCHAR(255),
        profilePicture VARCHAR(255),
        isConfirmed BOOLEAN DEFAULT FALSE,
        lastPasswordResetAt TIMESTAMP NULL,
        lastEmailConfirmationAt TIMESTAMP NULL,
        lang VARCHAR(255) DEFAULT 'en',
        theme VARCHAR(255) DEFAULT 'light',
        role ENUM('ADMIN','USER') DEFAULT 'USER',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await dbService.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(512) NULL,
        imageSrc VARCHAR(1024) NULL,
        createdById CHAR(36) NULL,
        updatedById CHAR(36) NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await dbService.query(`
      CREATE TABLE IF NOT EXISTS planograms (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        imageSrc VARCHAR(1024) NULL,
        storeId CHAR(36) NOT NULL,
        createdById CHAR(36) NULL,
        updatedById CHAR(36) NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_planograms_storeId FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);
  },
  
  async down(dbService) {
    await dbService.query(`
      DROP TABLE IF EXISTS planograms
    `);

    await dbService.query(`
      DROP TABLE IF EXISTS stores
    `);

    await dbService.query(`
      DROP TABLE IF EXISTS users
    `);
  }
};
