import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { BaseEntity } from './baseEntity';
import { User } from '../users/entities/user.entity';
import { Planogram } from '../planogram/planogram.entity';
import { Store } from '../store/store.entity';
import { Submission } from '../submissions/submission.entity';
import { Upload } from '../submissions/upload.entity';

@Injectable()
export class EntityInitializerService implements OnModuleInit {
  constructor(private databaseService: DatabaseService) {}

  async onModuleInit() {
    // Initialize all entities with the database service
    BaseEntity.setDatabaseService(this.databaseService);
    User.setDatabaseService(this.databaseService);
    Planogram.setDatabaseService(this.databaseService);
    Store.setDatabaseService(this.databaseService);
    Submission.setDatabaseService(this.databaseService);
    Upload.setDatabaseService(this.databaseService);

    // Set table names
    User.setTableName('users');
    Planogram.setTableName('planograms');
    Store.setTableName('stores');
    Submission.setTableName('submissions');
    Upload.setTableName('uploads');
  }
}
