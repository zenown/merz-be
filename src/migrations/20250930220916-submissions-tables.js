module.exports = {
  async up(dbService) {
    // Create submissions table
    await dbService.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id CHAR(36) PRIMARY KEY,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by_id CHAR(36) NOT NULL,
        store_id CHAR(36) NOT NULL,
        planogram_id CHAR(36) NOT NULL,
        upload_ids JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_submissions_uploaded_by_id FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_submissions_store_id FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        CONSTRAINT fk_submissions_planogram_id FOREIGN KEY (planogram_id) REFERENCES planograms(id) ON DELETE CASCADE
      )
    `);

    // Create uploads table
    await dbService.query(`
      CREATE TABLE IF NOT EXISTS uploads (
        id CHAR(36) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        filesize VARCHAR(50) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by_id CHAR(36) NOT NULL,
        store_id CHAR(36) NOT NULL,
        planogram_id CHAR(36) NOT NULL,
        submission_id CHAR(36) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_uploads_uploaded_by_id FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_uploads_store_id FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        CONSTRAINT fk_uploads_planogram_id FOREIGN KEY (planogram_id) REFERENCES planograms(id) ON DELETE CASCADE,
        CONSTRAINT fk_uploads_submission_id FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
      )
    `);
  },
  
  async down(dbService) {
    await dbService.query(`
      DROP TABLE IF EXISTS uploads
    `);

    await dbService.query(`
      DROP TABLE IF EXISTS submissions
    `);
  }
};
