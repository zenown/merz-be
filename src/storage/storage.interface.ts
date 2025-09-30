// src/storage/storage.interface.ts
export interface StorageConfig {
  storageType: 'local' | 's3';
  s3?: {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string; // For custom S3-compatible services
  };
  local?: {
    uploadDir: string;
  };
}

export interface UploadedFile {
  path: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}
