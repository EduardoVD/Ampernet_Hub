import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ResponsibilitiesService } from './responsibilities.service';
import { CreateResponsibilityDto } from './dto/create-responsibility.dto';
import { UpdateResponsibilityDto } from './dto/update-responsibility.dto';

@ApiTags('Responsibilities')
@Controller('responsibilities')
export class ResponsibilitiesController {
  constructor(private readonly responsibilitiesService: ResponsibilitiesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar matriz de responsabilidades por cidade e setor' })
  @ApiQuery({ name: 'city', required: false, description: 'Filtrar por cidade' })
  @ApiQuery({ name: 'sector', required: false, description: 'Filtrar por setor' })
  findAll(@Query('city') city?: string, @Query('sector') sector?: string) {
    return this.responsibilitiesService.findAll(city, sector);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar responsável específico pelo ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.responsibilitiesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cadastrar novo responsável na matriz (Admin e Supervisor)' })
  @ApiResponse({ status: 201, description: 'Responsável cadastrado com sucesso.' })
  create(@Body() createDto: CreateResponsibilityDto) {
    return this.responsibilitiesService.create(createDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar dados de um responsável na matriz (Admin e Supervisor)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateResponsibilityDto,
  ) {
    return this.responsibilitiesService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um responsável da matriz (Admin e Supervisor)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.responsibilitiesService.remove(id);
  }
}
