import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  NotFoundException,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Query } from '@nestjs/common';
import { ConfirmEmailDto } from './dto/confirm-email.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns the user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req) {
    const { password, ...user } = req.user;
    return user;
  }

  @Get()
  @ApiOperation({ summary: 'List users with search and sort options' })
  @ApiResponse({ status: 200, description: 'Returns users list' })
  @ApiQuery({ name: 'email', required: false, type: String, description: 'Filter by email' })
  @ApiQuery({ name: 'firstName', required: false, type: String, description: 'Filter by first name' })
  @ApiQuery({ name: 'lastName', required: false, type: String, description: 'Filter by last name' })
  @ApiQuery({ name: 'isConfirmed', required: false, type: Boolean, description: 'Filter by confirmation status' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by role' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in firstName, lastName, and email fields' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field (firstName, lastName, email, createdAt, updatedAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  async listUsers(@Query() query: any) {
    // Only allow certain filter fields to avoid exposing sensitive data
    const { email, firstName, lastName, isConfirmed, role, search, sortBy, sortOrder } = query;
    return this.usersService.findAll({
      filter: { email, firstName, lastName, isConfirmed, role },
      search,
      sortBy,
      sortOrder
    });
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    try {
      const updatedUser = await this.usersService.update(
        req.user.id,
        updateProfileDto,
      );
      const { password, ...result } = updatedUser;
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to update profile');
    }
  }

  @Post('send-confirmation-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send email confirmation link' })
  @ApiResponse({
    status: 200,
    description: 'Confirmation email sent successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendConfirmationEmail(@Req() req) {
    try {
      const result = await this.usersService.sendConfirmationEmail(
        req.user.id,
        req.user.email,
      );
      if (!result) {
        throw new HttpException(
          'Failed to send confirmation email',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return { message: 'Confirmation email sent successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to send confirmation email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('confirm-email')
  @ApiOperation({ summary: 'Confirm user email address' })
  @ApiResponse({ status: 200, description: 'Email confirmed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired confirmation token',
  })
  async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    const result = await this.usersService.confirmEmail(confirmEmailDto.token);
    if (!result) {
      throw new HttpException(
        'Invalid or expired confirmation token',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { message: 'Email confirmed successfully' };
  }

  @Post('profile-picture')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Update user profile picture' })
  @ApiResponse({
    status: 200,
    description: 'Profile picture updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfilePicture(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      const updatedUser = await this.usersService.updateProfilePicture(
        req.user.id,
        file,
      );
      const { password, ...result } = updatedUser;
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update profile picture',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('profile-picture')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user profile picture' })
  @ApiResponse({
    status: 200,
    description: 'Profile picture deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteProfilePicture(@Req() req) {
    try {
      const updatedUser = await this.usersService.deleteProfilePicture(
        req.user.id,
      );
      const { password, ...result } = updatedUser;
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete profile picture',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
