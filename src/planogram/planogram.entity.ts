import { BaseEntity } from '../database/baseEntity';

export interface PlanogramData {
  id?: string;
  name: string;
  description: string;
  imageSrc?: string;
  storeId: string;
  createdById?: string;
  updatedById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Planogram extends BaseEntity {
  static tableName = 'planograms';
}


