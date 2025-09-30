import { BaseEntity } from '../database/baseEntity';

export interface StoreData {
  id?: string;
  name: string;
  address?: string;
  imageSrc?: string;
  createdById?: string;
  updatedById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Store extends BaseEntity {
  static tableName = 'stores';

  static async findByName(name: string) {
    return this.findByCondition({ name });
  }
}


