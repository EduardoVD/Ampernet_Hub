//Português - Importa os decorators de injeção de dependência e exceções HTTP padrão do NestJS.
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';

//Português - Importa o decorator para injetar o repositório específico da entidade User.
import { InjectRepository } from '@nestjs/typeorm';

//Português - Importa a interface de Repositório padrão do TypeORM.
import { Repository } from 'typeorm';

//Português - Importa a biblioteca bcrypt para criptografia unidirecional de senhas.
import * as bcrypt from 'bcrypt';

//Português - Importa a entidade User mapeada para a tabela no banco de dados.
import { User } from './entities/user.entity';

//Português - Importa o DTO com a estrutura dos dados recebidos no cadastro.
import { CreateUserDto } from './dto/create-user.dto';

//Português - Importa o DTO com a estrutura dos dados para atualização de usuário.
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  //Português - Injeta o repositório TypeORM da entidade User no construtor da classe.
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  //Português - Método assíncrono para criar um novo usuário no sistema.
  async create(createUserDto: CreateUserDto): Promise<User> {
    //Português - Verifica se já existe um usuário cadastrado com o mesmo e-mail.
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    //Português - Lança erro HTTP 409 (Conflict) se o e-mail já estiver em uso.
    if (existingUser) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail no sistema');
    }

    //Português - Gera o salt e aplica o hash criptográfico na senha com fator de custo 10.
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    //Português - Instancia a nova entidade substituindo a senha em texto puro pelo hash.
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    //Português - Salva o novo registro na tabela 'users' do MySQL e retorna os dados. 
    return await this.userRepository.save(newUser);
  }

  //Português - Método para listar todos os usuários cadastrados.
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  //Português - Método para buscar um usuário específico pelo ID numérico.
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    //Português - Lança erro HTTP 404 caso o identificador não exista.
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não foi encontrado`);
    }

    return user;
  }

  //Português - Método de consulta por e-mail (Usado internamente pelo fluxo de login/JWT, incluindo a senha para validação).
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  //Português - Método para atualizar informações de um usuário existente.
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    //Português - Se uma nova senha for informada no update, aplica o hash antes de salvar.
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    //Português - Mescla as alterações na entidade existente e grava no banco.
    this.userRepository.merge(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  //Português - Método para remover um registro de usuário do banco.
  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { message: `Usuário ${id} removido com sucesso` };
  }
}