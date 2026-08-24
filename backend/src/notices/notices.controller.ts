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

//Português - Importa o guard de autenticação do Passport.
import { AuthGuard } from '@nestjs/passport';

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

  //Português - Rota POST /notices: Criação de novo recado (Requer autenticação JWT).
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cadastrar um novo aviso/recado no mural' })
  @ApiResponse({ status: 201, description: 'Recado publicado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado (Token ausente ou inválido).' })
  create(@Body() createNoticeDto: CreateNoticeDto, @Request() req: any) {
    //Português - req.user contém a entidade User injetada automaticamente pela JwtStrategy.
    return this.noticesService.create(createNoticeDto, req.user);
  }

  //Português - Rota GET /notices: Listagem geral de recados para o mural (Acesso público ou autenticado).
  @Get()
  @ApiOperation({ summary: 'Listar todos os avisos do mural (ordenados por data)' })
  @ApiResponse({ status: 200, description: 'Lista de recados retornada com sucesso.' })
  findAll() {
    return this.noticesService.findAll();
  }

  //Português - Rota GET /notices/:id: Consulta de um recado por ID.
  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de um recado específico pelo ID' })
  @ApiResponse({ status: 200, description: 'Recado encontrado.' })
  @ApiResponse({ status: 404, description: 'Recado não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.findOne(id);
  }

  //Português - Rota PATCH /notices/:id: Edição de aviso existente (Requer autenticação JWT).
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
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

  //Português - Rota DELETE /notices/:id: Exclusão de aviso do mural (Requer autenticação JWT).
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um recado do mural' })
  @ApiResponse({ status: 200, description: 'Recado removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Recado não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.remove(id);
  }
}
