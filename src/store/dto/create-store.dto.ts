import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsUrl, Length } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ description: 'Store name' })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  @Length(1, 512)
  address?: string;

  @ApiPropertyOptional({ description: 'Image URL (S3 or public URL)' })
  @IsOptional()
  @IsString()
  imageSrc?: string;

  @ApiPropertyOptional({ description: 'Creator user id (UUID)' })
  @IsOptional()
  @IsUUID()
  createdById?: string;

  @ApiPropertyOptional({ description: 'Updater user id (UUID)' })
  @IsOptional()
  @IsUUID()
  updatedById?: string;
}


