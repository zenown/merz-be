import { BaseEntity } from '../../database/baseEntity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface UserData {
  id?: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  googleId?: string;
  profilePicture?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isConfirmed?: boolean;
  lang?: string;
  theme?: string;
  lastPasswordResetAt?: Date;
  lastEmailConfirmationAt?: Date;
  createdById?: string;
  updatedById?: string;
  role?: UserRole;
}
@Entity('users')
export class User extends BaseEntity {
  tableName = 'users';
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ default: false })
  isConfirmed: boolean;

  @Column({ default: 'en', nullable: true })
  lang: string;

  @Column({ default: 'light', nullable: true })
  theme: string;

  @Column({ nullable: true })
  lastPasswordResetAt: Date;

  @Column({ nullable: true })
  lastEmailConfirmationAt: Date;

  @Column({ nullable: true })
  createdById: string;

  @Column({ nullable: true })
  updatedById: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static async findByEmail(email: string) {
    return this.findByCondition({ email });
  }

  static async findByGoogleId(googleId: string) {
    return this.findByCondition({ googleId });
  }
}
