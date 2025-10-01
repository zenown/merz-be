import { BaseEntity } from '../database/baseEntity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface SubmissionData {
  id?: string;
  uploadedAt?: Date;
  uploadedById?: string;
  storeId?: string;
  planogramId?: string;
  uploadIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Entity('submissions')
export class Submission extends BaseEntity {
  static tableName = 'submissions';

  @PrimaryGeneratedColumn('uuid')
  id: string;

 

  @Column({ name: 'uploaded_by_id', type: 'char', length: 36 })
  uploadedById: string;

  @Column({ name: 'store_id', type: 'char', length: 36 })
  storeId: string;

  @Column({ name: 'planogram_id', type: 'char', length: 36 })
  planogramId: string;

  @Column({ name: 'upload_ids', type: 'json' })
  uploadIds: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  @Column({ name: 'uploaded_at' })
  uploadedAt: Date;
}
