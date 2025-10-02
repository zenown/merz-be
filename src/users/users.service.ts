import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User, UserData } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { StorageService } from '../storage/storage.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

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

  async findAll(options: {
    filter?: Partial<UserData>;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<any[]> {
    const { filter = {}, search, sortBy, sortOrder } = options;
    
    const searchColumns = ['firstName', 'lastName', 'email'];
    const users = await User.findAllWithSearchAndSort({
      search,
      searchColumns,
      sortBy,
      sortOrder,
      filter: filter as Record<string, any>
    }) as UserData[];
    
    // delete password field 
    users.forEach(user => {
      delete user.password;
    });
    return this.populateUserRelations(users);
  }

  async findById(id: string): Promise<any> {
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const populatedUsers = await this.populateUserRelations([user]);
    return populatedUsers[0];
  }

  private async populateUserRelations(users: UserData[]): Promise<any[]> {
    const populatedUsers: any[] = [];
    
    for (const user of users) {
      const populatedUser: any = { ...user };
      
      // Populate createdBy relation
      if (user.createdById) {
        try {
          const createdBy = await User.findById(user.createdById);
          populatedUser.createdBy = createdBy ? {
            id: createdBy.id,
            email: createdBy.email,
            firstName: createdBy.firstName,
            lastName: createdBy.lastName,
            profilePicture: createdBy.profilePicture,
            role: createdBy.role
          } : null;
        } catch (error) {
          populatedUser.createdBy = null;
        }
      }
      
      // Populate updatedBy relation
      if (user.updatedById) {
        try {
          const updatedBy = await User.findById(user.updatedById);
          populatedUser.updatedBy = updatedBy ? {
            id: updatedBy.id,
            email: updatedBy.email,
            firstName: updatedBy.firstName,
            lastName: updatedBy.lastName,
            profilePicture: updatedBy.profilePicture,
            role: updatedBy.role
          } : null;
        } catch (error) {
          populatedUser.updatedBy = null;
        }
      }
      
      populatedUsers.push(populatedUser);
    }
    
    return populatedUsers;
  }

  async findByEmail(email: string): Promise<UserData> {
    return User.findByEmail(email) as Promise<UserData>;
  }

  async create(userData: UserData): Promise<UserData> {
    return User.create(userData) as Promise<UserData>;
  }

  async update(id: string, userData: Partial<UserData>): Promise<UserData> {
    return User.update(id, userData) as Promise<UserData>;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await User.delete(id);
  }
  async sendConfirmationEmail(userId: string, email: string): Promise<boolean> {
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
    userId: string,
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

  async deleteProfilePicture(userId: string): Promise<UserData> {
    const user = await this.findById(userId);

    if (user.profilePicture) {
      const picturePath = user.profilePicture.replace(/^.*\/public\//i, '');
      await this.storageService.deleteFile(picturePath);
    }

    return this.update(userId, {
      profilePicture: '',
    }) as Promise<UserData>;
  }

  private generatePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each category
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  async createAdminUser(userData: {
    role: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<{ user: UserData; password: string }> {
    // Check if user already exists
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate password
    const generatedPassword = this.generatePassword();
    
    // Hash the password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(generatedPassword, saltRounds);

    // Create user data
    const newUserData: UserData = {
      id: uuidv4(),
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role as any,

      isConfirmed: true, // Admin created users are auto-confirmed
    };

    // Try to send email first
    const emailSent = await this.emailService.sendPasswordEmail(
      userData.email,
      generatedPassword,
      userData.firstName,
      userData.lastName
    );

    if (!emailSent) {
      throw new Error('Failed to send password email. User not created.');
    }

    // Create user only if email was sent successfully
    const user = await this.create(newUserData);
    
    return { user, password: generatedPassword };
  }
}
