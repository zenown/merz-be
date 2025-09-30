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
import { StoreService } from './store.service';
import { Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@ApiTags('stores')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  @ApiOperation({ summary: 'List stores' })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'address', required: false, type: String })
  async findAll(@Query() query: any) {
    const { name, address } = query;
    return this.storeService.findAll({ name, address } as any);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by id' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    return this.storeService.findById(id);
  }

  @Post()  
  @Roles('ADMIN')

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create store (admin)' })
  @ApiBody({ type: CreateStoreDto })
  async create(@Req() req, @Body() body: CreateStoreDto) {
    const payload = { ...body, createdById: req.user?.id,updatedById: req.user?.id } as any;
    return this.storeService.create(payload);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update store (admin)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateStoreDto })
  async update(@Param('id') id: string, @Req() req, @Body() body: UpdateStoreDto) {
    const payload = { ...body, updatedById: req.user?.id } as any;
    return this.storeService.update(id, payload);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete store (admin)' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    return this.storeService.remove(id);
  }
}


