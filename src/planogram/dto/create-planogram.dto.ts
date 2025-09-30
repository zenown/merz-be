import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreatePlanogramDto {
  @ApiProperty({ description: 'Planogram name' })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Image URL (S3 or public URL)' })
  @IsOptional()
  @IsString()
  imageSrc?: string;

  @ApiProperty({ description: 'Store id (UUID)' })
  @IsUUID()
  storeId: string;

  @ApiPropertyOptional({ description: 'Creator user id (UUID)' })
  @IsOptional()
  @IsUUID()
  createdById?: string;

  @ApiPropertyOptional({ description: 'Updater user id (UUID)' })
  @IsOptional()
  @IsUUID()
  updatedById?: string;
}


