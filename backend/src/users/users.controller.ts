//Português - Importa os decorators de rota e parâmetros HTTP do NestJS.
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

//Português - Importa os decorators de autenticação, permissão e Swagger.
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

//Português - Importa o serviço de usuários contendo as regras de negócio.
import { UsersService } from './users.service';

//Português - Importa os DTOs de entrada de dados.
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

//Português - Agrupa todas as rotas deste controller na categoria "Users" dentro do Swagger e restringe ao perfil Admin.
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  //Português - Injeta o serviço UsersService no construtor.
  constructor(private readonly usersService: UsersService) {}

  //Português - Rota POST /users: Criação de um novo usuário.
  @Post()
  @ApiOperation({ summary: 'Cadastrar um novo usuário/colaborador' })
  @ApiResponse({ status: 201, description: 'Usuário cadastrado com sucesso.' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  //Português - Rota GET /users: Listagem de todos os usuários.
  @Get()
  @ApiOperation({ summary: 'Listar todos os colaboradores cadastrados' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findAll() {
    return this.usersService.findAll();
  }

  //Português - Rota GET /users/:id: Busca de um usuário específico por ID.
  @Get(':id')
  @ApiOperation({ summary: 'Buscar dados de um usuário pelo ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  //Português - Rota PATCH /users/:id: Atualização parcial dos dados do usuário.
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar informações de um usuário existente' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  //Português - Rota DELETE /users/:id: Exclusão de usuário.
  @Delete(':id')
  @ApiOperation({ summary: 'Remover um usuário do sistema' })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}