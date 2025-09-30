import { Module, DynamicModule, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { STORAGE_CONFIG } from './storage.constants';
import { StorageConfig } from './storage.interface';

@Global()
@Module({})
export class StorageModule {
  static register(config: StorageConfig): DynamicModule {
    return {
      module: StorageModule,
      providers: [
        {
          provide: STORAGE_CONFIG,
          useValue: config,
        },
        StorageService,
      ],
      exports: [
        StorageService,
        {
          provide: STORAGE_CONFIG,
          useValue: config,
        },
      ],
    };
  }
}
