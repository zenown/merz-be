import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Store, StoreData } from './store.entity';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class StoreService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService
  ) {
    Store.setDatabaseService(this.databaseService);
    Store.setTableName('stores');
    User.setDatabaseService(this.databaseService);
    User.setTableName('users');
  }

  async findAll(options: {
    filter?: Partial<StoreData>;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<any[]> {
    const { filter = {}, search, sortBy, sortOrder } = options;
    
    const searchColumns = ['name', 'address'];
    const stores = await Store.findAllWithSearchAndSort({
      search,
      searchColumns,
      sortBy,
      sortOrder,
      filter: filter as Record<string, any>
    }) as StoreData[];
    
    return this.populateStoreRelations(stores);
  }

  async findById(id: string): Promise<any> {
    const store = await Store.findById(id) as StoreData;
    if (!store) return null;
    const populatedStores = await this.populateStoreRelations([store]);
    return populatedStores[0];
  }

  private async populateStoreRelations(stores: StoreData[]): Promise<any[]> {
    const populatedStores: any[] = [];
    
    for (const store of stores) {
      const populatedStore: any = { ...store };
      
      // Add imageUrl field
      if (store.imageSrc) {
        populatedStore.imageUrl = this.storageService.generateSignedUrl(store.imageSrc);
      }
      
      // Populate createdBy relation
      if (store.createdById) {
        try {
          const createdBy = await User.findById(store.createdById);
          populatedStore.createdBy = createdBy ? {
            id: createdBy.id,
            email: createdBy.email,
            firstName: createdBy.firstName,
            lastName: createdBy.lastName,
            profilePicture: createdBy.profilePicture,
            role: createdBy.role
          } : null;
        } catch (error) {
          populatedStore.createdBy = null;
        }
      }
      
      // Populate updatedBy relation
      if (store.updatedById) {
        try {
          const updatedBy = await User.findById(store.updatedById);
          populatedStore.updatedBy = updatedBy ? {
            id: updatedBy.id,
            email: updatedBy.email,
            firstName: updatedBy.firstName,
            lastName: updatedBy.lastName,
            profilePicture: updatedBy.profilePicture,
            role: updatedBy.role
          } : null;
        } catch (error) {
          populatedStore.updatedBy = null;
        }
      }
      
      populatedStores.push(populatedStore);
    }
    
    return populatedStores;
  }

  create(data: StoreData): Promise<StoreData> {
    const row = { id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() } as StoreData;
    console.log(row);
    return Store.create(row) as Promise<StoreData>;
  }

  update(id: string, data: Partial<StoreData>): Promise<StoreData> {
    const row = { ...data, updatedAt: new Date() } as Partial<StoreData>;
    return Store.update(id, row) as Promise<StoreData>;
  }

  remove(id: string): Promise<void> {
    return Store.delete(id) as unknown as Promise<void>;
  }
}


