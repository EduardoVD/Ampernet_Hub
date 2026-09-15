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
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueStatus } from './enums/issue-status.enum';

@ApiTags('Issues')
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as ocorrências e problemas gerais' })
  @ApiQuery({ name: 'status', enum: IssueStatus, required: false, description: 'Filtrar por status' })
  findAll(@Query('status') status?: IssueStatus) {
    return this.issuesService.findAll(status);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar detalhes de uma ocorrência específica' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar uma nova ocorrência (Apenas Admin e Supervisor)' })
  @ApiResponse({ status: 201, description: 'Ocorrência registrada com sucesso.' })
  create(@Body() createIssueDto: CreateIssueDto, @Request() req: any) {
    return this.issuesService.create(createIssueDto, req.user);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar informações de uma ocorrência' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIssueDto: UpdateIssueDto,
  ) {
    return this.issuesService.update(id, updateIssueDto);
  }

  @Patch(':id/resolve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar ocorrência como resolvida no horário atual' })
  resolve(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.resolve(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover uma ocorrência do sistema' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.remove(id);
  }
}
