import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Get,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  @Post('admin/login')
  @HttpCode(200)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: 'Log in a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async adminLogin(@Req() req, @Res({ passthrough: true }) res: Response) {
    const { accessToken, user } = await this.authService.login(req.user);
    if(user.role !== 'ADMIN') {
      throw new UnauthorizedException('Unauthorized');
    }

    // Set JWT as HTTP-only cookie
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: parseInt(process.env.JWT_EXPIRATION || '3600') * 1000,
    });

    return { user , accessToken};
  }


  @Post('login')
  @HttpCode(200)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: 'Log in a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Req() req, @Res({ passthrough: true }) res: Response) {
    const { accessToken, user } = await this.authService.login(req.user);

    // Set JWT as HTTP-only cookie
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: parseInt(process.env.JWT_EXPIRATION || '3600') * 1000,
    });

    return { user , accessToken};
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Log out a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear JWT cookie
    res.clearCookie('jwt');

    return { message: 'Logout successful' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google authentication' })
  googleAuth() {
    // This route initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google authentication callback' })
  async googleAuthCallback(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, user } = await this.authService.login(req.user);

    // Set JWT as HTTP-only cookie
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: parseInt(process.env.JWT_EXPIRATION || '3600') * 1000,
    });

    // Redirect to frontend or return user data
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/`);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password successfully changed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.newPassword,
      changePasswordDto.oldPassword,
    );
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.sendForgotPasswordEmail(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.confirmForgottenPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }
}

