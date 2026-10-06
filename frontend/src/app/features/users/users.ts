import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, UserItem } from '../../core/services/users';
import { AuthService } from '../../core/services/auth';
import { ToastService } from '../../core/services/toast';
import { ConfirmService } from '../../core/services/confirm';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.scss']
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  currentUser = this.authService.currentUser;
  users = signal<UserItem[]>([]);
  isLoading = signal(false);

  searchTerm = signal('');
  roleFilter = signal<'all' | 'admin' | 'supervisor' | 'user'>('all');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  isModalOpen = signal(false);
  editingUserId = signal<number | null>(null);
  formName = signal('');
  formEmail = signal('');
  formPassword = signal('');
  formRole = signal<'admin' | 'supervisor' | 'user'>('user');
  formIsActive = signal(true);
  isSubmitting = signal(false);

  isPasswordModalOpen = signal(false);
  targetUserForPassword = signal<UserItem | null>(null);
  newPassword = signal('');

  filteredUsers = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();

    return this.users().filter((user) => {
      const matchSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);

      const matchRole = role === 'all' || user.role === role;

      const matchStatus =
        status === 'all' ||
        (status === 'active' && user.isActive) ||
        (status === 'inactive' && !user.isActive);

      return matchSearch && matchRole && matchStatus;
    });
  });

  totalCount = computed(() => this.users().length);
  activeCount = computed(() => this.users().filter((u) => u.isActive).length);
  adminCount = computed(() => this.users().filter((u) => u.role === 'admin').length);

  ngOnInit(): void {
    this.loadUsers();
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

  openCreateModal(): void {
    this.editingUserId.set(null);
    this.formName.set('');
    this.formEmail.set('');
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
    const password = this.formPassword().trim();
    const role = this.formRole();
    const isActive = this.formIsActive();
    const id = this.editingUserId();

    if (!name || !email) {
      this.toastService.warning('Por favor, preencha o Nome e o E-mail corporativo.', 'Campos Obrigatórios');
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
          this.toastService.error('Erro ao atualizar colaborador. Verifique se o e-mail já não está em uso.', 'Erro');
        }
      });
    } else {
      this.usersService
        .createUser({
          name,
          email,
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
            this.toastService.error('Erro ao cadastrar colaborador. Verifique se o e-mail já está cadastrado.', 'Erro');
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
      title: `${user.isActive ? 'Desativar' : 'Reativar'} Conta`,
      message: `Deseja realmente ${actionText} o acesso do colaborador "${user.name}"?`,
      confirmText: user.isActive ? 'Sim, Desativar' : 'Sim, Reativar',
      cancelText: 'Cancelar',
      type: user.isActive ? 'warning' : 'primary'
    }).then((confirmed) => {
      if (confirmed) {
        this.usersService.updateUser(user.id, { isActive: !user.isActive }).subscribe({
          next: () => {
            this.users.update((list) =>
              list.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
            );
            this.toastService.success(
              `Conta de "${user.name}" ${user.isActive ? 'reativada' : 'desativada'} com sucesso.`,
              'Status Atualizado'
            );
          },
          error: (err) => {
            console.error('Erro ao alterar status do usuário:', err);
            this.toastService.error('Não foi possível alterar o status do colaborador.', 'Erro');
          }
        });
      }
    });
  }

  openResetPasswordModal(user: UserItem, event?: Event): void {
    if (event) event.stopPropagation();
    this.targetUserForPassword.set(user);
    this.newPassword.set('');
    this.isPasswordModalOpen.set(true);
  }

  closePasswordModal(): void {
    this.isPasswordModalOpen.set(false);
    this.targetUserForPassword.set(null);
    this.newPassword.set('');
  }

  submitNewPassword(): void {
    const user = this.targetUserForPassword();
    const pass = this.newPassword().trim();

    if (!user || !pass || pass.length < 6) {
      this.toastService.warning('A nova senha deve ter no mínimo 6 caracteres.', 'Senha Inválida');
      return;
    }

    this.isSubmitting.set(true);
    this.usersService.updateUser(user.id, { password: pass }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closePasswordModal();
        this.toastService.success(`Senha do colaborador "${user.name}" redefinida com sucesso!`, 'Senha Alterada');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Erro ao redefinir senha:', err);
        this.toastService.error('Não foi possível redefinir a senha.', 'Erro');
      }
    });
  }

  deleteUser(user: UserItem, event?: Event): void {
    if (event) event.stopPropagation();

    if (this.currentUser()?.id === user.id) {
      this.toastService.warning('Você não pode remover a sua própria conta conectada.', 'Ação Bloqueada');
      return;
    }

    this.confirmService.confirm({
      title: 'Remover Colaborador',
      message: `Atenção: Deseja realmente excluir permanentemente a conta de "${user.name}"?`,
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.usersService.deleteUser(user.id).subscribe({
          next: () => {
            this.users.update((list) => list.filter((u) => u.id !== user.id));
            this.toastService.success('Colaborador removido com sucesso.', 'Removido');
          },
          error: (err) => {
            console.error('Erro ao excluir usuário:', err);
            this.toastService.error('Não foi possível remover o colaborador.', 'Erro');
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
      case 'user':
        return 'Colaborador';
      default:
        return role;
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

