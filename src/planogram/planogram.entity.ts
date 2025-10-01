import { BaseEntity } from '../database/baseEntity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface PlanogramData {
  id?: string;
  name: string;
  description: string;
  imageSrc?: string;
  storeId: string;
  createdById?: string;
  updatedById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Entity('planograms')
export class Planogram extends BaseEntity {
  static tableName = 'planograms';

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ name: 'image_src', nullable: true })
  imageSrc: string;

  @Column({ name: 'store_id', type: 'char', length: 36 })
  storeId: string;

  @Column({ name: 'created_by_id', type: 'char', length: 36, nullable: true })
  createdById: string;

  @Column({ name: 'updated_by_id', type: 'char', length: 36, nullable: true })
  updatedById: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


