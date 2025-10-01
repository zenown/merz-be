import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsArray } from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({ description: 'Store ID (UUID)' })
  @IsUUID()
  storeId: string;

  @ApiProperty({ description: 'Planogram ID (UUID)' })
  @IsUUID()
  planogramId: string;

  @ApiPropertyOptional({ description: 'Array of upload IDs to associate with submission' })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  uploadIds?: string[];
}
