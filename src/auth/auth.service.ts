import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserData, UserRole } from '../users/entities/user.entity';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Remove password from response
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: UserData) {
    const payload = { email: user.email, sub: user.id };

    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async register(userData: UserData) {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create the user with hashed password
    const newUser = await this.usersService.create({
      id: uuidv4(),
      ...userData,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    // Remove password from response
    const { password: _, ...result } = newUser;
    if (newUser.id)
      await this.usersService.sendConfirmationEmail(newUser.id, newUser.email);

    return this.login(result);
  }

  async changePassword(
    userId: string,
    newPassword: string,
    oldPassword?: string,
  ): Promise<UserData> {
    const user = await this.usersService.findById(userId);

    // If user has a password, verify old password unless it's a Google user without password
    if (user.password && !user.googleId) {
      if (!oldPassword) {
        throw new UnauthorizedException('Old password is required');
      }
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid old password');
      }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password
    const updatedUser = await this.usersService.update(userId, {
      password: hashedPassword,
    });

    // Remove password from response
    const { password: _, ...result } = updatedUser;
    return result;
  }

  async validateGoogleUser(profile: any) {
    const { emails, name, photos, id } = profile;
    const email = emails[0].value;

    // Check if user already exists
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // If user doesn't exist, create a new one
      user = await this.usersService.create({
        email,
        firstName: name.givenName,
        lastName: name.familyName,
        googleId: id,
        profilePicture: photos[0]?.value,
      });
    } else if (!user.googleId && user.id) {
      // If user exists but doesn't have googleId, update it
      user = await this.usersService.update(user.id, {
        googleId: id,
        firstName: name.givenName || user.firstName,
        lastName: name.familyName || user.lastName,
        profilePicture: photos[0]?.value || user.profilePicture,
      });
    }

    // Remove password from response
    const { password: _, ...result } = user;

    return result;
  }

  async sendForgotPasswordEmail(email: string): Promise<boolean> {
    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if password reset was requested within 24 hours
    if (user.lastPasswordResetAt) {
      const lastReset = new Date(user.lastPasswordResetAt);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        throw new Error(
          'Please wait 24 hours before requesting another password reset',
        );
      }
    }

    // Generate token
    const token = this.jwtService.sign(
      { userId: user.id },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '24h',
      },
    );

    // Update lastPasswordResetAt and send reset email
    if (user.id)
      await this.usersService.update(user.id, {
        lastPasswordResetAt: new Date(),
      });
    return this.emailService.sendPasswordResetEmail(email, token, user?.lang);
  }

  async confirmForgottenPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    if (!token || !newPassword) {
      console.error('Invalid request: Missing token or newPassword');
      throw new UnauthorizedException(
        'Invalid request: Missing required fields',
      );
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const userId = payload.userId;
      const user = await this.usersService.findById(userId);

      if (!user) {
        console.error('User not found for userId:', userId);
        throw new NotFoundException('User not found');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user with new password
      await this.usersService.update(userId, {
        password: hashedPassword,
      });

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('Invalid or expired token');
      }
      throw error;
    }
  }
}

