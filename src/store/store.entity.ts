import { BaseEntity } from '../database/baseEntity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface StoreData {
  id?: string;
  name: string;
  address?: string;
  imageSrc?: string;
  createdById?: string;
  updatedById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Entity('stores')
export class Store extends BaseEntity {
  static tableName = 'stores';

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'image_src', nullable: true })
  imageSrc: string;

  @Column({ name: 'created_by_id', type: 'char', length: 36, nullable: true })
  createdById: string;

  @Column({ name: 'updated_by_id', type: 'char', length: 36, nullable: true })
  updatedById: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  static async findByName(name: string) {
    return this.findByCondition({ name });
  }
}


