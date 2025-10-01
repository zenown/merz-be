import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddUploadToSubmissionDto {
  @ApiProperty({ description: 'Upload ID to add to submission (UUID)' })
  @IsUUID()
  uploadId: string;
}
