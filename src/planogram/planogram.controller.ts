import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PlanogramService } from './planogram.service';
import { Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreatePlanogramDto } from './dto/create-planogram.dto';
import { UpdatePlanogramDto } from './dto/update-planogram.dto';

@ApiTags('planograms')
@Controller('planograms')
export class PlanogramController {
  constructor(private readonly planogramService: PlanogramService) {}

  @Get()
  @ApiOperation({ summary: 'List planograms with search and sort options' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by planogram name' })
  @ApiQuery({ name: 'storeId', required: false, type: String, description: 'Filter by store ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in name and description fields' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field (name, description, createdAt, updatedAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  async findAll(@Query() query: any) {
    const { name, storeId, search, sortBy, sortOrder } = query;
    return this.planogramService.findAll({
      filter: { name, storeId },
      search,
      sortBy,
      sortOrder
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get planogram by id' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    return this.planogramService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create planogram (admin)' })
  @ApiBody({ type: CreatePlanogramDto })
  async create(@Req() req, @Body() body: CreatePlanogramDto) {
    const payload = { ...body, createdById: req.user?.id,updatedById: req.user?.id } as any;
    return this.planogramService.create(payload);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update planogram (admin)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdatePlanogramDto })
  async update(@Param('id') id: string, @Req() req, @Body() body: UpdatePlanogramDto) {
    const payload = { ...body, updatedById: req.user?.id } as any;
    return this.planogramService.update(id, payload);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete planogram (admin)' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    return this.planogramService.remove(id);
  }
}


