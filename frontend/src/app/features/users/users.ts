import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, UserItem } from '../../core/services/users';
import { SectorsService, SectorWithCollaboratorsItem, SectorItem } from '../../core/services/sectors';
import { AuthService } from '../../core/services/auth';
import { ToastService } from '../../core/services/toast';
import { ConfirmService } from '../../core/services/confirm';
import { EmptyStateComponent } from '../../core/components/empty-state/empty-state.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent],
  templateUrl: './users.html',
  styleUrls: ['./users.scss']
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private sectorsService = inject(SectorsService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  currentUser = this.authService.currentUser;
  users = signal<UserItem[]>([]);
  isLoading = signal(false);

  // Setores e Departamentos
  sectorsList = signal<SectorItem[]>([]);
  isSectorsModalOpen = signal(false);
  sectorsWithCollaborators = signal<SectorWithCollaboratorsItem[]>([]);
  isLoadingSectors = signal(false);
  newSectorName = signal('');
  isCreatingSector = signal(false);
  expandedSectorIds = signal<Set<number>>(new Set());

  searchTerm = signal('');
  sectorFilter = signal<string>('all');
  roleFilter = signal<'all' | 'admin' | 'supervisor' | 'user'>('all');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  isModalOpen = signal(false);
  editingUserId = signal<number | null>(null);
  formName = signal('');
  formEmail = signal('');
  formSector = signal('');
  formPassword = signal('');
  formRole = signal<'admin' | 'supervisor' | 'user'>('user');
  formIsActive = signal(true);
  isSubmitting = signal(false);

  isPasswordModalOpen = signal(false);
  targetUserForPassword = signal<UserItem | null>(null);
  newPassword = signal('');
  confirmPassword = signal('');

  filteredUsers = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const sector = this.sectorFilter();
    const role = this.roleFilter();
    const status = this.statusFilter();

    return this.users().filter((user) => {
      const matchSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.sector && user.sector.toLowerCase().includes(search));

      const matchSector =
        sector === 'all' ||
        (user.sector && user.sector.trim().toLowerCase() === sector.trim().toLowerCase());

      const matchRole = role === 'all' || user.role === role;

      const matchStatus =
        status === 'all' ||
        (status === 'active' && user.isActive) ||
        (status === 'inactive' && !user.isActive);

      return matchSearch && matchSector && matchRole && matchStatus;
    });
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadSectors();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.usersService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erro ao carregar colaboradores:', err);
      }
    });
  }

  loadSectors(): void {
    this.sectorsService.getSectors().subscribe({
      next: (data) => this.sectorsList.set(data),
      error: (err) => console.error('Erro ao carregar lista de setores:', err),
    });
  }

  openCreateModal(): void {
    this.editingUserId.set(null);
    this.formName.set('');
    this.formEmail.set('');
    this.formSector.set('');
    this.formPassword.set('');
    this.formRole.set('user');
    this.formIsActive.set(true);
    this.isModalOpen.set(true);
  }

  openEditModal(user: UserItem, event?: Event): void {
    if (event) event.stopPropagation();

    this.editingUserId.set(user.id);
    this.formName.set(user.name);
    this.formEmail.set(user.email);
    this.formSector.set(user.sector || '');
    this.formPassword.set('');
    this.formRole.set(user.role);
    this.formIsActive.set(user.isActive);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingUserId.set(null);
  }

  submitForm(): void {
    const name = this.formName().trim();
    const email = this.formEmail().trim();
    const sector = this.formSector().trim();
    const password = this.formPassword().trim();
    const role = this.formRole();
    const isActive = this.formIsActive();
    const id = this.editingUserId();

    if (!name || !email) {
      this.toastService.warning('Por favor, preencha o Nome e o E-mail corporativo.', 'Campos Obrigatórios');
      return;
    }

    if (!sector) {
      this.toastService.warning('Por favor, selecione o Setor do colaborador.', 'Campo Obrigatório');
      return;
    }

    if (!id && (!password || password.length < 6)) {
      this.toastService.warning('Para cadastrar um novo colaborador, informe uma senha de no mínimo 6 caracteres.', 'Senha Obrigatória');
      return;
    }

    this.isSubmitting.set(true);

    if (id) {
      const payload: any = {
        name,
        email,
        sector,
        role,
        isActive
      };
      if (password && password.length >= 6) {
        payload.password = password;
      }

      this.usersService.updateUser(id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadUsers();
          this.toastService.success('Dados do colaborador atualizados com sucesso!', 'Colaboradores');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Erro ao atualizar usuário:', err);
          const msg = err.error?.message || 'Erro ao atualizar colaborador. Verifique se o e-mail já não está em uso.';
          this.toastService.error(msg, 'Erro');
        }
      });
    } else {
      this.usersService
        .createUser({
          name,
          email,
          sector,
          password,
          role,
          isActive
        })
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeModal();
            this.loadUsers();
            this.toastService.success('Novo colaborador cadastrado com sucesso!', 'Cadastrado');
          },
          error: (err) => {
            this.isSubmitting.set(false);
            console.error('Erro ao cadastrar usuário:', err);
            const msg = err.error?.message || 'Erro ao cadastrar colaborador. Verifique se o e-mail já está cadastrado.';
            this.toastService.error(msg, 'Erro');
          }
        });
    }
  }

  toggleStatus(user: UserItem, event?: Event): void {
    if (event) event.stopPropagation();

    if (this.currentUser()?.id === user.id) {
      this.toastService.warning('Você não pode desativar o seu próprio usuário logado.', 'Ação Bloqueada');
      return;
    }

    const actionText = user.isActive ? 'desativar' : 'reativar';
    this.confirmService.confirm({
      title: `${user.isActive ? 'Desativar' : 'Reativar'} Colaborador`,
      message: `Tem certeza que deseja ${actionText} o acesso de "${user.name}"?`,
      confirmText: user.isActive ? 'Sim, Desativar' : 'Sim, Reativar',
      cancelText: 'Cancelar',
      type: user.isActive ? 'danger' : 'primary'
    }).then((confirmed) => {
      if (confirmed) {
        this.usersService.updateUser(user.id, { isActive: !user.isActive }).subscribe({
          next: (updated) => {
            this.users.update((list) =>
              list.map((u) => (u.id === updated.id ? { ...u, isActive: updated.isActive } : u))
            );
            this.toastService.success(
              `Colaborador ${updated.name} ${updated.isActive ? 'reativado' : 'desativado'} com sucesso.`,
              'Status Atualizado'
            );
          },
          error: (err) => {
            console.error('Erro ao alternar status do colaborador:', err);
            const msg = err.error?.message || 'Erro ao alterar status do colaborador.';
            this.toastService.error(msg, 'Erro');
          }
        });
      }
    });
  }

  openResetPasswordModal(user: UserItem, event?: Event): void {
    if (event) event.stopPropagation();
    this.targetUserForPassword.set(user);
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.isPasswordModalOpen.set(true);
  }

  closePasswordModal(): void {
    this.isPasswordModalOpen.set(false);
    this.targetUserForPassword.set(null);
    this.newPassword.set('');
    this.confirmPassword.set('');
  }

  submitNewPassword(): void {
    const user = this.targetUserForPassword();
    const pass = this.newPassword().trim();
    const confirm = this.confirmPassword().trim();

    if (!user) return;

    if (!pass || pass.length < 6) {
      this.toastService.warning('A senha deve conter no mínimo 6 caracteres.', 'Senha Inválida');
      return;
    }

    if (pass !== confirm) {
      this.toastService.warning('As senhas informadas não coincidem. Digite novamente.', 'Confirmação Incorreta');
      return;
    }

    this.isSubmitting.set(true);
    this.usersService.updateUser(user.id, { password: pass }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closePasswordModal();
        this.toastService.success(`Senha de ${user.name} redefinida com sucesso!`, 'Senha Atualizada');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Erro ao redefinir senha:', err);
        this.toastService.error('Erro ao redefinir senha do colaborador.', 'Erro');
      }
    });
  }

  deleteUser(user: UserItem, event?: Event): void {
    if (event) event.stopPropagation();

    if (this.currentUser()?.id === user.id) {
      this.toastService.warning('Você não pode excluir sua própria conta conectada.', 'Ação Bloqueada');
      return;
    }

    this.confirmService.confirm({
      title: 'Excluir Colaborador',
      message: `Tem certeza que deseja remover permanentemente o acesso de "${user.name}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.usersService.deleteUser(user.id).subscribe({
          next: () => {
            this.users.update((list) => list.filter((u) => u.id !== user.id));
            this.toastService.success(`Colaborador "${user.name}" removido com sucesso.`, 'Excluído');
          },
          error: (err) => {
            console.error('Erro ao excluir usuário:', err);
            const msg = err.error?.message || 'Erro ao excluir colaborador.';
            this.toastService.error(msg, 'Erro');
          }
        });
      }
    });
  }

  formatRole(role: string): string {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'supervisor':
        return 'Supervisor';
      default:
        return 'Colaborador';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // --- Gestão de Setores / Departamentos ---
  openSectorsModal(): void {
    this.isSectorsModalOpen.set(true);
    this.newSectorName.set('');
    this.expandedSectorIds.set(new Set());
    this.loadSectorsWithCollaborators();
  }

  closeSectorsModal(): void {
    this.isSectorsModalOpen.set(false);
    this.newSectorName.set('');
  }

  loadSectorsWithCollaborators(): void {
    this.isLoadingSectors.set(true);
    this.sectorsService.getSectorsWithCollaborators().subscribe({
      next: (data) => {
        // Ordena decrescente por quantidade de colaboradores (setor com mais colaboradores no topo)
        const sorted = [...data].sort((a, b) => {
          if (b.collaboratorsCount !== a.collaboratorsCount) {
            return b.collaboratorsCount - a.collaboratorsCount;
          }
          return a.name.localeCompare(b.name, 'pt-BR');
        });
        this.sectorsWithCollaborators.set(sorted);
        // Por padrão, todos os setores começam recolhidos (colapsados)
        this.expandedSectorIds.set(new Set());
        this.isLoadingSectors.set(false);
      },
      error: (err) => {
        this.isLoadingSectors.set(false);
        console.error('Erro ao carregar setores:', err);
        this.toastService.error('Erro ao carregar lista de setores.', 'Erro');
      },
    });
  }

  toggleSectorCollapse(sectorId: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.expandedSectorIds.update((set) => {
      const next = new Set(set);
      if (next.has(sectorId)) {
        next.delete(sectorId);
      } else {
        next.add(sectorId);
      }
      return next;
    });
  }

  isSectorExpanded(sectorId: number): boolean {
    return this.expandedSectorIds().has(sectorId);
  }

  submitNewSector(): void {
    const name = this.newSectorName().trim();
    if (!name) {
      this.toastService.warning('Informe o nome do novo setor.', 'Campo Obrigatório');
      return;
    }

    this.isCreatingSector.set(true);
    this.sectorsService.createSector(name).subscribe({
      next: (created) => {
        this.isCreatingSector.set(false);
        this.newSectorName.set('');
        this.toastService.success(`Setor "${created.name}" cadastrado com sucesso!`, 'Setor Criado');
        this.loadSectors();
        this.loadSectorsWithCollaborators();
      },
      error: (err) => {
        this.isCreatingSector.set(false);
        const msg = err.error?.message || 'Erro ao cadastrar setor.';
        this.toastService.error(msg, 'Erro');
      },
    });
  }

  deleteSector(sector: SectorWithCollaboratorsItem, event?: Event): void {
    if (event) event.stopPropagation();

    if (sector.collaboratorsCount > 0) {
      this.toastService.warning(
        `Não é possível remover o setor "${sector.name}" pois há ${sector.collaboratorsCount} colaborador(es) vinculado(s).`,
        'Setor em Uso'
      );
      return;
    }

    this.confirmService.confirm({
      title: 'Excluir Setor',
      message: `Deseja realmente remover o setor "${sector.name}"?`,
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.sectorsService.deleteSector(sector.id).subscribe({
          next: () => {
            this.toastService.success(`Setor "${sector.name}" removido com sucesso.`, 'Removido');
            this.loadSectors();
            this.loadSectorsWithCollaborators();
          },
          error: (err) => {
            const msg = err.error?.message || 'Erro ao remover setor.';
            this.toastService.error(msg, 'Erro');
          }
        });
      }
    });
  }
}
