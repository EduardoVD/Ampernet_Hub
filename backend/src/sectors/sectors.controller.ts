import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SectorsService } from './sectors.service';
import { CreateSectorDto } from './dto/create-sector.dto';

@ApiTags('Sectors')
@Controller('sectors')
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os setores cadastrados' })
  findAll() {
    return this.sectorsService.findAll();
  }

  @Get('with-collaborators')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar setores com respectivos colaboradores vinculados' })
  findAllWithCollaborators() {
    return this.sectorsService.findAllWithCollaborators();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar setor por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sectorsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cadastrar novo setor (Admin e Supervisor)' })
  @ApiResponse({ status: 201, description: 'Setor cadastrado com sucesso.' })
  create(@Body() createDto: CreateSectorDto) {
    return this.sectorsService.create(createDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um setor cadastrado (Apenas Admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sectorsService.remove(id);
  }
}

