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

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'google_id', nullable: true })
  googleId: string;

  @Column({ name: 'profile_picture', nullable: true })
  profilePicture: string;

  @Column({ name: 'is_confirmed', default: false })
  isConfirmed: boolean;

  @Column({ name: 'lang', default: 'en', nullable: true })
  lang: string;

  @Column({ name: 'theme', default: 'light', nullable: true })
  theme: string;

  @Column({ name: 'last_password_reset_at', nullable: true })
  lastPasswordResetAt: Date;

  @Column({ name: 'last_email_confirmation_at', nullable: true })
  lastEmailConfirmationAt: Date;

  @Column({ name: 'created_by_id', type: 'char', length: 36, nullable: true })
  createdById: string;

  @Column({ name: 'updated_by_id', type: 'char', length: 36, nullable: true })
  updatedById: string;

  @Column({ name: 'role', type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  static async findByEmail(email: string) {
    return this.findByCondition({ email });
  }

  static async findByGoogleId(googleId: string) {
    return this.findByCondition({ googleId });
  }
}
