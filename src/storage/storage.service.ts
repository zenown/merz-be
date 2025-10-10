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
    // Use local storage if explicitly set to 'local' or if S3 config is incomplete
    this.isLocalStorage = config.storageType === 'local' || 
      !config.s3?.bucketName || 
      !config.s3?.region || 
      !config.s3?.accessKeyId || 
      !config.s3?.secretAccessKey ||
      config.storageType === undefined; // Default to local if storageType is undefined

    // Configure AWS SDK to use signature version 4
    AWS.config.update({
      signatureVersion: 'v4',
    });
    
    console.log('Storage config:', {
      storageType: config.storageType,
      isLocalStorage: this.isLocalStorage,
      s3Config: config.s3,
      hasValidS3Config: !!(config.s3?.bucketName && config.s3?.region && config.s3?.accessKeyId && config.s3?.secretAccessKey)
    });

    if (!this.isLocalStorage && config && config?.s3 && 
        config.s3.bucketName && config.s3.region && 
        config.s3.accessKeyId && config.s3.secretAccessKey) {
      this.s3 = new AWS.S3({
        region: config.s3.region,
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
        endpoint: config.s3.endpoint,
        signatureVersion: 'v4',
        s3ForcePathStyle: false,
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
    if (!this.config?.s3?.bucketName) {
      throw new Error('S3 bucket name is not configured');
    }

    const filename = `${uuidv4()}-${file.originalname}`;
    const key = folder ? `${folder}/${filename}` : filename;

    const params = {
      Bucket: this.config.s3.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const result = await this.s3.upload(params as any).promise();

    // Generate signed URL for the uploaded file
    const signedUrl = this.generateSignedUrl(key);

    return {
      path: key,
      filename,
      mimetype: file.mimetype,
      size: file.size,
      url: signedUrl,
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
        if (!this.config?.s3?.bucketName) {
          throw new Error('S3 bucket name is not configured');
        }
        await this.s3
          .deleteObject({
            Bucket: this.config.s3.bucketName,
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

  generateSignedUrl(filepath: string, expiresIn: number = 3600): string {
    if (!filepath) return '';

    if (this.isLocalStorage) {
      return `/public/${filepath.replace(/\\/g, '/')}`;
    } else {
      if (!this.config?.s3?.bucketName) {
        throw new Error('S3 bucket name is not configured');
      }
      
      try {
        const params = {
          Bucket: this.config.s3.bucketName,
          Key: filepath,
          Expires: expiresIn, // URL expires in specified seconds (default 1 hour)
        };
        
        // Ensure we're using AWS4 signature version
        return this.s3.getSignedUrl('getObject', params);
      } catch (error) {
        console.error('Error generating signed URL:', error);
        throw new Error('Failed to generate signed URL');
      }
    }
  }

  getPublicUrl(filepath: string): string {
    if (!filepath) return '';

    if (this.isLocalStorage) {
      return `/public/${filepath.replace(/\\/g, '/')}`;
    } else {
      // For S3, return a signed URL instead of direct URL
      return this.generateSignedUrl(filepath);
    }
  }
}
