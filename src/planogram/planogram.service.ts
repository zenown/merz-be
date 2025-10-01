import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Planogram, PlanogramData } from './planogram.entity';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { Store } from '../store/store.entity';

@Injectable()
export class PlanogramService {
  constructor(private readonly databaseService: DatabaseService) {
    Planogram.setDatabaseService(this.databaseService);
    Planogram.setTableName('planograms');
    User.setDatabaseService(this.databaseService);
    User.setTableName('users');
    Store.setDatabaseService(this.databaseService);
    Store.setTableName('stores');
  }

  async findAll(options: {
    filter?: Partial<PlanogramData>;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<any[]> {
    const { filter = {}, search, sortBy, sortOrder } = options;
    
    const searchColumns = ['name', 'description'];
    const planograms = await Planogram.findAllWithSearchAndSort({
      search,
      searchColumns,
      sortBy,
      sortOrder,
      filter: filter as Record<string, any>
    }) as PlanogramData[];
    
    return this.populatePlanogramRelations(planograms);
  }

  async findById(id: string): Promise<any> {
    const planogram = await Planogram.findById(id) as PlanogramData;
    if (!planogram) return null;
    const populatedPlanograms = await this.populatePlanogramRelations([planogram]);
    return populatedPlanograms[0];
  }

  private async populatePlanogramRelations(planograms: PlanogramData[]): Promise<any[]> {
    const populatedPlanograms: any[] = [];
    
    for (const planogram of planograms) {
      const populatedPlanogram: any = { ...planogram };
      
      // Populate store relation
      if (planogram.storeId) {
        try {
          const store = await Store.findById(planogram.storeId);
          populatedPlanogram.store = store ? {
            id: store.id,
            name: store.name,
            address: store.address,
            imageSrc: store.imageSrc
          } : null;
        } catch (error) {
          populatedPlanogram.store = null;
        }
      }
      
      // Populate createdBy relation
      if (planogram.createdById) {
        try {
          const createdBy = await User.findById(planogram.createdById);
          populatedPlanogram.createdBy = createdBy ? {
            id: createdBy.id,
            email: createdBy.email,
            firstName: createdBy.firstName,
            lastName: createdBy.lastName,
            profilePicture: createdBy.profilePicture,
            role: createdBy.role
          } : null;
        } catch (error) {
          populatedPlanogram.createdBy = null;
        }
      }
      
      // Populate updatedBy relation
      if (planogram.updatedById) {
        try {
          const updatedBy = await User.findById(planogram.updatedById);
          populatedPlanogram.updatedBy = updatedBy ? {
            id: updatedBy.id,
            email: updatedBy.email,
            firstName: updatedBy.firstName,
            lastName: updatedBy.lastName,
            profilePicture: updatedBy.profilePicture,
            role: updatedBy.role
          } : null;
        } catch (error) {
          populatedPlanogram.updatedBy = null;
        }
      }
      
      populatedPlanograms.push(populatedPlanogram);
    }
    
    return populatedPlanograms;
  }

  create(data: PlanogramData): Promise<PlanogramData> {
    const row = { id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() } as PlanogramData;
    return Planogram.createRecord(row) as Promise<PlanogramData>;
  }

  update(id: string, data: Partial<PlanogramData>): Promise<PlanogramData> {
    const row = { ...data, updatedAt: new Date() } as Partial<PlanogramData>;
    return Planogram.updateRecord(id, row) as Promise<PlanogramData>;
  }

  remove(id: string): Promise<void> {
    return Planogram.deleteRecord(id) as unknown as Promise<void>;
  }
}


