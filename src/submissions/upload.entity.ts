import { BaseEntity } from '../database/baseEntity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface UploadData {
  id?: string;
  filename: string;
  filesize: string;
  fileType: string;
  uploadedAt?: Date;
  uploadedById?: string;
  storeId?: string;
  planogramId?: string;
  submissionId?: string | null;
  imageSrc?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Entity('uploads')
export class Upload extends BaseEntity {
  static tableName = 'uploads';

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  filesize: string;

  @Column({ name: 'file_type' })
  fileType: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @Column({ name: 'uploaded_by_id' })
  uploadedById: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column({ name: 'planogram_id' })
  planogramId: string;

  @Column({ name: 'submission_id', nullable: true })
  submissionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  get imageSrc(): string {
    // This will be populated by the service layer
    // The actual URL generation will be handled in the submissions service
    return '';
  }
}
