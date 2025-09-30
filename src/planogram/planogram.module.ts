import { Module } from '@nestjs/common';
import { PlanogramController } from './planogram.controller';
import { PlanogramService } from './planogram.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PlanogramController],
  providers: [PlanogramService],
  exports: [PlanogramService],
})
export class PlanogramModule {}


