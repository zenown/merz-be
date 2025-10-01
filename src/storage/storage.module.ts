import { Module, DynamicModule, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { STORAGE_CONFIG } from './storage.constants';
import { StorageConfig } from './storage.interface';

@Global()
@Module({})
export class StorageModule {
  static register(config: StorageConfig): DynamicModule {
    return {
      module: StorageModule,
      controllers: [StorageController],
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
