import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  //Português - Injeta o repositório TypeORM da entidade User e o ConfigService.
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedInitialAdmin();
    await this.assignDefaultSectorToExistingUsers();
  }

  //Português - Garante a existência de ao menos um administrador padrão no sistema.
  private async seedInitialAdmin(): Promise<void> {
    try {
      const adminCount = await this.userRepository.count({
        where: { role: UserRole.ADMIN },
      });

      if (adminCount === 0) {
        const email = this.configService.get<string>(
          'DEFAULT_ADMIN_EMAIL',
          'admin@ampernet.com.br',
        );
        const password = this.configService.get<string>(
          'DEFAULT_ADMIN_PASSWORD',
          'admin123',
        );
        const name = this.configService.get<string>(
          'DEFAULT_ADMIN_NAME',
          'Administrador Ampernet',
        );

        const existingByEmail = await this.userRepository.findOne({
          where: { email },
        });

        if (!existingByEmail) {
          const hashedPassword = await bcrypt.hash(password, 10);
          const adminUser = this.userRepository.create({
            name,
            email,
            password: hashedPassword,
            role: UserRole.ADMIN,
            sector: 'Administração',
            isActive: true,
          });
          await this.userRepository.save(adminUser);
          this.logger.log(
            `[SEED] Usuário administrador inicial criado com sucesso: ${email}`,
          );
        } else {
          existingByEmail.role = UserRole.ADMIN;
          if (!existingByEmail.sector) {
            existingByEmail.sector = 'Administração';
          }
          await this.userRepository.save(existingByEmail);
          this.logger.log(
            `[SEED] Usuário existente (${email}) promovido para o perfil ADMIN.`,
          );
        }
      } else {
        this.logger.log('[SEED] Administrador já existente no banco de dados.');
      }
    } catch (error) {
      this.logger.error('[SEED] Erro ao verificar/criar administrador inicial:', error);
    }
  }

  //Português - Garante que usuários existentes sem setor recebam um setor padrão.
  private async assignDefaultSectorToExistingUsers(): Promise<void> {
    try {
      const usersWithoutSector = await this.userRepository
        .createQueryBuilder('user')
        .where('user.sector IS NULL OR TRIM(user.sector) = ""')
        .getMany();

      for (const u of usersWithoutSector) {
        u.sector = u.role === UserRole.ADMIN ? 'Administração' : 'NOC';
        await this.userRepository.save(u);
      }
    } catch (err) {
      this.logger.warn('Aviso ao sincronizar setores em usuários legados:', err);
    }
  }

  //Português - Método assíncrono para criar um novo usuário no sistema.
  async create(createUserDto: CreateUserDto): Promise<User> {
    const normalizedEmail = createUserDto.email.trim().toLowerCase();
    const normalizedSector = (createUserDto.sector || 'Administração').trim();

    //Português - Verifica se já existe um usuário cadastrado com o mesmo e-mail.
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
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
      email: normalizedEmail,
      sector: normalizedSector,
      password: hashedPassword,
    });

    //Português - Salva o novo registro na tabela 'users' do MySQL e retorna os dados sem o hash de senha. 
    const savedUser = await this.userRepository.save(newUser);
    const { password: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
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

  //Português - Método de consulta por e-mail com normalização case-insensitive.
  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('LOWER(user.email) = LOWER(:email)', { email: normalizedEmail })
      .getOne();
  }

  //Português - Método para atualizar informações de um usuário existente com salvaguardas de segurança.
  async update(id: number, updateUserDto: UpdateUserDto, currentUserId?: number): Promise<User> {
    const user = await this.findOne(id);

    // 1. Tratamento seguro de senha: se vazia ou ausente, deleta do DTO para não sobrescrever o hash salvo
    if (updateUserDto.password && updateUserDto.password.trim().length > 0) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password.trim(), 10);
    } else {
      delete updateUserDto.password;
    }

    // 2. Normalização e validação de e-mail único se alterado
    if (updateUserDto.email) {
      updateUserDto.email = updateUserDto.email.trim().toLowerCase();
      if (updateUserDto.email !== user.email) {
        const emailInUse = await this.userRepository.findOne({
          where: { email: updateUserDto.email },
        });
        if (emailInUse) {
          throw new ConflictException('Este e-mail já está em uso por outro usuário');
        }
      }
    }

    // 3. Validação de obrigatoriedade de setor caso fornecido
    if (updateUserDto.sector !== undefined) {
      if (!updateUserDto.sector || !updateUserDto.sector.trim()) {
        throw new BadRequestException('O setor do colaborador é obrigatório.');
      }
      updateUserDto.sector = updateUserDto.sector.trim();
    }

    // 4. Regra de segurança: Não permitir auto-desativação do admin conectado
    if (currentUserId && id === currentUserId && updateUserDto.isActive === false) {
      throw new BadRequestException('Você não pode desativar sua própria conta de administrador.');
    }

    // 5. Regra de segurança: Garantir que o sistema nunca fique sem nenhum administrador ativo
    if (
      user.role === UserRole.ADMIN &&
      (updateUserDto.isActive === false || (updateUserDto.role && updateUserDto.role !== UserRole.ADMIN))
    ) {
      const activeAdminCount = await this.userRepository.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestException('Operação bloqueada: o sistema precisa manter ao menos um administrador ativo.');
      }
    }

    //Português - Mescla as alterações na entidade existente e grava no banco.
    this.userRepository.merge(user, updateUserDto);
    const savedUser = await this.userRepository.save(user);
    const { password: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  //Português - Método para remover um registro com salvaguardas contra auto-exclusão e exclusão do último admin.
  async remove(id: number, currentUserId?: number): Promise<{ message: string }> {
    const user = await this.findOne(id);

    // 1. Regra de segurança: Impedir que o administrador exclua sua própria conta ativa
    if (currentUserId && id === currentUserId) {
      throw new BadRequestException('Você não pode excluir sua própria conta de administrador conectada.');
    }

    // 2. Regra de segurança: Impedir excluir o único administrador restante
    if (user.role === UserRole.ADMIN) {
      const adminCount = await this.userRepository.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Operação bloqueada: não é possível excluir o único administrador do sistema.');
      }
    }

    await this.userRepository.remove(user);
    return { message: `Usuário ${id} removido com sucesso` };
  }
}
