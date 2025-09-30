import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User, UserData } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UsersService {
  constructor(
    private databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
  ) {
    // Set database service for the User entity
    User.setDatabaseService(this.databaseService);
    User.setTableName('users');
  }

  async findAll(filter?: Partial<UserData>): Promise<UserData[]> {
    if (filter && Object.keys(filter).length > 0) {
      return User.findAllByFilter(filter as Record<string, any>) as Promise<UserData[]>;
    }
    return User.findAll() as Promise<UserData[]>;
  }

  async findById(id: number): Promise<UserData> {
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user as UserData;
  }

  async findByEmail(email: string): Promise<UserData> {
    return User.findByEmail(email) as Promise<UserData>;
  }

  async create(userData: UserData): Promise<UserData> {
    return User.create(userData) as Promise<UserData>;
  }

  async update(id: number, userData: Partial<UserData>): Promise<UserData> {
    return User.update(id, userData) as Promise<UserData>;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    await User.delete(id);
  }
  async sendConfirmationEmail(userId: number, email: string): Promise<boolean> {
    // Check if user is already confirmed
    const user = await this.findById(userId);

    if (user.isConfirmed) {
      return true; // User is already confirmed
    }

    // Check if last email confirmation was sent within 24 hours
    if (user.lastEmailConfirmationAt) {
      const lastConfirmation = new Date(user.lastEmailConfirmationAt);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - lastConfirmation.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        throw new Error(
          'Please wait 24 hours before requesting another confirmation email',
        );
      }
    }

    // Generate token
    const token = this.jwtService.sign(
      { userId },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('EMAIL_CONFIRMATION_EXPIRY'),
      },
    );

    // Update lastEmailConfirmationAt and send confirmation email
    await this.update(userId, { lastEmailConfirmationAt: new Date() });
    return this.emailService.sendConfirmationEmail(email, token, user?.lang);
  }

  async confirmEmail(token: string): Promise<boolean> {
    try {
      // Verify token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Update user
      const userId = payload.userId;
      await this.update(userId, {
        isConfirmed: true,
        lastPasswordResetAt: new Date(),
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async updateProfilePicture(
    userId: number,
    file: Express.Multer.File,
  ): Promise<UserData> {
    const user = await this.findById(userId);

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldPicturePath = user.profilePicture.replace(/^.*\/public\//i, '');
      await this.storageService.deleteFile(oldPicturePath);
    }

    // Upload new profile picture
    const uploadedFile = await this.storageService.uploadFile(
      file,
      'profile-pictures',
    );

    // Update user profile with new picture URL
    return this.update(userId, {
      profilePicture: uploadedFile.url,
    }) as Promise<UserData>;
  }

  async deleteProfilePicture(userId: number): Promise<UserData> {
    const user = await this.findById(userId);

    if (user.profilePicture) {
      const picturePath = user.profilePicture.replace(/^.*\/public\//i, '');
      await this.storageService.deleteFile(picturePath);
    }

    return this.update(userId, {
      profilePicture: '',
    }) as Promise<UserData>;
  }
}
