// src/storage/storage.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { STORAGE_CONFIG } from './storage.constants';
import { StorageConfig, UploadedFile } from './storage.interface';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

@Injectable()
export class StorageService {
  private s3: AWS.S3;
  private isLocalStorage: boolean;

  constructor(@Inject(STORAGE_CONFIG) private readonly config: StorageConfig) {
    this.isLocalStorage =
      config.storageType === 'local' || process.env.NODE_ENV === 'development';

    if (!this.isLocalStorage && config && config?.s3) {
      this.s3 = new AWS.S3({
        region: config.s3.region,
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
        endpoint: config.s3.endpoint,
      });
    } else if (config.local) {
      // Ensure upload directory exists
      try {
        if (!fs.existsSync(config.local.uploadDir)) {
          fs.mkdirSync(config.local.uploadDir, { recursive: true });
        }
      } catch (error) {
        console.error('Failed to create upload directory:', error);
      }
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<UploadedFile> {
    if (this.isLocalStorage) {
      return this.saveLocally(file, folder);
    } else {
      return this.uploadToS3(file, folder);
    }
  }

  private async saveLocally(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadedFile> {
    const uploadDir = this.config.local?.uploadDir || 'public';
    const folderPath = path.join(uploadDir, folder);

    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      await mkdirAsync(folderPath, { recursive: true });
    }

    const filename = `${uuidv4()}-${file.originalname}`;
    const filepath = path.join(folderPath, filename);

    // Write file
    fs.writeFileSync(filepath, file.buffer);

    const relativePath = path.join(folder, filename);

    return {
      path: relativePath,
      filename,
      mimetype: file.mimetype,
      size: file.size,
      url: `/public/${relativePath.replace(/\\/g, '/')}`,
    };
  }

  private async uploadToS3(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadedFile> {
    const filename = `${uuidv4()}-${file.originalname}`;
    const key = folder ? `${folder}/${filename}` : filename;

    const params = {
      Bucket: this.config?.s3?.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const result = await this.s3.upload(params as any).promise();

    return {
      path: key,
      filename,
      mimetype: file.mimetype,
      size: file.size,
      url: result.Location,
    };
  }

  async deleteFile(filepath: string): Promise<boolean> {
    if (!filepath) return false;

    try {
      if (this.isLocalStorage) {
        const uploadDir = this.config.local?.uploadDir || 'public';
        const fullPath = path.join(uploadDir, filepath);

        if (fs.existsSync(fullPath)) {
          await unlinkAsync(fullPath);
        }
      } else {
        await this.s3
          .deleteObject({
            Bucket: this.config?.s3?.bucketName + '',
            Key: filepath,
          })
          .promise();
      }
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  getPublicUrl(filepath: string): string {
    if (!filepath) return '';

    if (this.isLocalStorage) {
      return `/public/${filepath.replace(/\\/g, '/')}`;
    } else {
      return `https://${this.config?.s3?.bucketName}.s3.${this.config?.s3?.region}.amazonaws.com/${filepath}`;
    }
  }
}
