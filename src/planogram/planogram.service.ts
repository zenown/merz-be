import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Planogram, PlanogramData } from './planogram.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PlanogramService {
  constructor(private readonly databaseService: DatabaseService) {
    Planogram.setDatabaseService(this.databaseService);
    Planogram.setTableName('planograms');
  }

  findAll(filter?: Partial<PlanogramData>): Promise<PlanogramData[]> {
    if (filter && Object.keys(filter).length > 0) {
      return Planogram.findAllByFilter(filter as Record<string, any>) as Promise<PlanogramData[]>;
    }
    return Planogram.findAll() as Promise<PlanogramData[]>;
  }

  findById(id: string): Promise<PlanogramData> {
    return Planogram.findById(id) as Promise<PlanogramData>;
  }

  create(data: PlanogramData): Promise<PlanogramData> {
    const row = { id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() } as PlanogramData;
    return Planogram.create(row) as Promise<PlanogramData>;
  }

  update(id: string, data: Partial<PlanogramData>): Promise<PlanogramData> {
    const row = { ...data, updatedAt: new Date() } as Partial<PlanogramData>;
    return Planogram.update(id, row) as Promise<PlanogramData>;
  }

  remove(id: string): Promise<void> {
    return Planogram.delete(id) as unknown as Promise<void>;
  }
}


