//Português - Importa decorators do NestJS para manipulação de rotas, injeção e autenticação.
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

//Português - Importa os decorators do Swagger para documentação e suporte ao Bearer Token.
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

//Português - Importa o serviço e os DTOs do recurso de recados.
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@ApiTags('Notices')
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  //Português - Rota POST /notices: Criação de novo recado (Requer perfil Supervisor ou Admin).
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cadastrar um novo aviso/recado no mural (Apenas Admin e Supervisor)' })
  @ApiResponse({ status: 201, description: 'Recado publicado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado (Token ausente ou inválido).' })
  @ApiResponse({ status: 403, description: 'Proibido (Sem permissão de perfil).' })
  create(@Body() createNoticeDto: CreateNoticeDto, @Request() req: any) {
    //Português - req.user contém a entidade User injetada automaticamente pela JwtStrategy.
    return this.noticesService.create(createNoticeDto, req.user);
  }

  //Português - Rota GET /notices: Listagem geral de recados para o mural (Acesso público ou autenticado).
  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os avisos do mural com status de leitura' })
  findAll(@Request() req: any) {
    return this.noticesService.findAll(req.user?.id);
  }

  //Português - Rota GET /notices/:id: Consulta de um recado por ID.
  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de um recado específico pelo ID' })
  @ApiResponse({ status: 200, description: 'Recado encontrado.' })
  @ApiResponse({ status: 404, description: 'Recado não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.findOne(id);
  }

  //Português - Rota PATCH /notices/:id/read: Marcar aviso ou recado como lido.
  @Patch(':id/read')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar aviso como lido pelo usuário atual' })
  markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.noticesService.markAsRead(id, req.user);
  }

  //Português - Rota GET /notices/:id/read-status: Relatório de leitura (Admin e Supervisor).
  @Get(':id/read-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter status de confirmação de leitura do aviso' })
  getReadStatus(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.getReadStatus(id);
  }

  //Português - Rota PATCH /notices/:id: Edição de aviso existente (Requer autenticação JWT).
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar informações de um recado' })
  @ApiResponse({ status: 200, description: 'Recado atualizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Recado não encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoticeDto: UpdateNoticeDto,
  ) {
    return this.noticesService.update(id, updateNoticeDto);
  }

  //Português - Rota DELETE /notices/:id: Exclusão de aviso do mural (Requer perfil Supervisor ou Admin).
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um recado do mural (Apenas Admin e Supervisor)' })
  @ApiResponse({ status: 200, description: 'Recado removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido (Sem permissão de perfil).' })
  @ApiResponse({ status: 404, description: 'Recado não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.remove(id);
  }
}
