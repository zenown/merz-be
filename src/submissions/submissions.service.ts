import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Submission, SubmissionData } from './submission.entity';
import { Upload, UploadData } from './upload.entity';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { Store } from '../store/store.entity';
import { Planogram } from '../planogram/planogram.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
  ) {
    Submission.setDatabaseService(this.databaseService);
    Submission.setTableName('submissions');
    Upload.setDatabaseService(this.databaseService);
    Upload.setTableName('uploads');
    User.setDatabaseService(this.databaseService);
    User.setTableName('users');
    Store.setDatabaseService(this.databaseService);
    Store.setTableName('stores');
    Planogram.setDatabaseService(this.databaseService);
    Planogram.setTableName('planograms');
  }

  async findAll(options: {
    filter?: Partial<SubmissionData>;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<any[]> {
    const { filter = {}, search, sortBy, sortOrder } = options;
    
    const searchColumns = ['id'];
    const submissions = await Submission.findAllWithSearchAndSort({
      search,
      searchColumns,
      sortBy,
      sortOrder,
      filter: filter as Record<string, any>
    }) as SubmissionData[];
    
    return this.populateSubmissionRelations(submissions);
  }

  async findById(id: string): Promise<any> {
    const submission = await Submission.findById(id) as SubmissionData;
    if (!submission) return null;
    const populatedSubmissions = await this.populateSubmissionRelations([submission]);
    return populatedSubmissions[0];
  }

  private async populateSubmissionRelations(submissions: SubmissionData[]): Promise<any[]> {
    const populatedSubmissions: any[] = [];
    
    for (const submission of submissions) {
      const populatedSubmission: any = { ...submission };
      
      // Populate uploadedBy relation
      if (submission.uploadedById) {
        try {
          const uploadedBy = await User.findById(submission.uploadedById);
          populatedSubmission.uploadedBy = uploadedBy ? {
            id: uploadedBy.id,
            email: uploadedBy.email,
            firstName: uploadedBy.firstName,
            lastName: uploadedBy.lastName,
            profilePicture: uploadedBy.profilePicture,
            role: uploadedBy.role
          } : null;
        } catch (error) {
          populatedSubmission.uploadedBy = null;
        }
      }
      
      // Populate store relation
      if (submission.storeId) {
        try {
          const store = await Store.findById(submission.storeId);
          populatedSubmission.store = store ? {
            id: store.id,
            name: store.name,
            address: store.address,
            imageSrc: store.imageSrc
          } : null;
        } catch (error) {
          populatedSubmission.store = null;
        }
      }
      
      // Populate planogram relation
      if (submission.planogramId) {
        try {
          const planogram = await Planogram.findById(submission.planogramId);
          populatedSubmission.planogram = planogram ? {
            id: planogram.id,
            name: planogram.name,
            description: planogram.description,
            imageSrc: planogram.imageSrc
          } : null;
        } catch (error) {
          populatedSubmission.planogram = null;
        }
      }
      
      // Populate uploads relation
      if (submission.uploadIds && submission.uploadIds.length > 0) {
        try {
          const uploads = await Promise.all(
            submission.uploadIds.map(uploadId => Upload.findById(uploadId))
          );
          populatedSubmission.uploads = uploads.filter(upload => upload !== null);
        } catch (error) {
          populatedSubmission.uploads = [];
        }
      } else {
        populatedSubmission.uploads = [];
      }
      
      populatedSubmissions.push(populatedSubmission);
    }
    
    return populatedSubmissions;
  }

  async create(data: SubmissionData): Promise<SubmissionData> {
    const row = { 
      id: uuidv4(), 
      ...data, 
      uploadIds: data.uploadIds || [],
      createdAt: new Date(), 
      updatedAt: new Date() 
    } as SubmissionData;
    return Submission.createRecord(row) as Promise<SubmissionData>;
  }

  async createWithFileUpload(
    data: SubmissionData,
    file: Express.Multer.File,
    uploadedById: string
  ): Promise<{ submission: SubmissionData; upload: UploadData }> {
    // First create the upload
    const uploadData: UploadData = {
      id: uuidv4(),
      filename: file.originalname,
      filesize: file.size.toString(),
      fileType: file.mimetype,
      uploadedAt: new Date(),
      uploadedById,
      storeId: data.storeId,
      planogramId: data.planogramId,
      submissionId: '', // Will be updated after submission is created
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Upload file to storage
    const uploadedFile = await this.storageService.uploadFile(file, 'submissions');
    console.log('uploadedFile', uploadedFile);
    // Update upload data with file path
    uploadData.filename = uploadedFile.filename;
    
    // Create the submission first
    const submissionData: SubmissionData = {
      id: uuidv4(),
      uploadedAt: new Date(),
      uploadedById,
      storeId: data.storeId,
      planogramId: data.planogramId,
      uploadIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const submission = await this.create(submissionData);
    
    // Update upload with submission ID
    uploadData.submissionId = submission.id;
    const upload = await Upload.createRecord(uploadData) as UploadData;
    
    // Update submission with upload ID
    const updatedSubmission = await Submission.updateRecord(submission?.id || '', {
      uploadIds: [upload.id]
    }) as SubmissionData;

    return { submission: updatedSubmission, upload };
  }

  async addUploadToSubmission(
    submissionId: string,
    uploadId: string|undefined
  ): Promise<SubmissionData> {
    if (!uploadId) {
      throw new Error('Upload ID is required');
    }
    const submission:any = await Submission.findById(submissionId) as SubmissionData;
    if (!submission) {
      throw new Error('Submission not found');
    }

    const upload = await Upload.findById(uploadId) as UploadData;
    if (!upload) {
      throw new Error('Upload not found');
    }

    // Update upload with submission ID and store/planogram IDs from submission
    console.log('submission', submission);
    await Upload.updateRecord(uploadId, { 
      submissionId,
      storeId: submission.store_id,
      planogramId: submission.planogram_id
    });

    // Update submission with new upload ID
    const updatedUploadIds = [...(submission.uploadIds || []), uploadId];
    return Submission.updateRecord(submissionId, { uploadIds: updatedUploadIds }) as Promise<SubmissionData>;
  }

  async createUpload(
    data: {storeId: string, planogramId: string, submissionId: string},
    file: Express.Multer.File,
    uploadedById: string
  ): Promise<UploadData> {
    // Upload file to storage
    const uploadedFile = await this.storageService.uploadFile(file, 'submissions');
    
    // If submissionId is provided, get the submission to populate store and planogram IDs
    let storeId: string | undefined = data.storeId;
    let planogramId: string | undefined = data.planogramId;
    
    if (data.submissionId && (!storeId || !planogramId)) {
      const submission:any = await Submission.findById(data.submissionId) as SubmissionData;
      if (submission) {
        storeId = submission.store_id;
        planogramId = submission.planogram_id;
      }
    }
    // Guard against inserting empty strings into NOT NULL FKs
    if (!storeId || !planogramId) {
      throw new Error('Store ID and Planogram ID are required (provide both or a valid submissionId).');
    }
    const ensuredStoreId: string = storeId;
    const ensuredPlanogramId: string = planogramId;
    
    const uploadData: UploadData = {
      id: uuidv4(),
      filename: uploadedFile.filename,
      filesize: file.size.toString(),
      fileType: file.mimetype,
      uploadedAt: new Date(),
      uploadedById,
      storeId: ensuredStoreId,
      planogramId: ensuredPlanogramId,
      submissionId: data.submissionId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('uploadData', uploadData);

    return Upload.createRecord(uploadData) as Promise<UploadData>;
  }

  update(id: string, data: Partial<SubmissionData>): Promise<SubmissionData> {
    const row = { ...data, updatedAt: new Date() } as Partial<SubmissionData>;
    return Submission.updateRecord(id, row) as Promise<SubmissionData>;
  }

  remove(id: string): Promise<void> {
    return Submission.deleteRecord(id) as unknown as Promise<void>;
  }
}

