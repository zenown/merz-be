import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Store, StoreData } from './store.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StoreService {
  constructor(private readonly databaseService: DatabaseService) {
    Store.setDatabaseService(this.databaseService);
    Store.setTableName('stores');
  }

  findAll(filter?: Partial<StoreData>): Promise<StoreData[]> {
    if (filter && Object.keys(filter).length > 0) {
      return Store.findAllByFilter(filter as Record<string, any>) as Promise<StoreData[]>;
    }
    return Store.findAll() as Promise<StoreData[]>;
  }

  findById(id: string): Promise<StoreData> {
    return Store.findById(id) as Promise<StoreData>;
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


