import { PartialType } from '@nestjs/swagger';
import { CreatePlanogramDto } from './create-planogram.dto';

export class UpdatePlanogramDto extends PartialType(CreatePlanogramDto) {}


