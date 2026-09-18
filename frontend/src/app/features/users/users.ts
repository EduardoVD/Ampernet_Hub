import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, UserItem } from '../../core/services/users';
import { AuthService } from '../../core/services/auth';

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

  currentUser = this.authService.currentUser;
  users = signal<UserItem[]>([]);
  isLoading = signal(false);

  // Filtros
  searchTerm = signal('');
  roleFilter = signal<'all' | 'admin' | 'supervisor' | 'user'>('all');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  // Estado do Modal (Criação / Edição)
  isModalOpen = signal(false);
  editingUserId = signal<number | null>(null);
  formName = signal('');
  formEmail = signal('');
  formPassword = signal('');
  formRole = signal<'admin' | 'supervisor' | 'user'>('user');
  formIsActive = signal(true);
  isSubmitting = signal(false);

  // Estado do Modal de Redefinição de Senha
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
      alert('Por favor, preencha o Nome e o E-mail corporativo.');
      return;
    }

    if (!id && (!password || password.length < 6)) {
      alert('Para cadastrar um novo colaborador, informe uma senha de no mínimo 6 caracteres.');
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
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Erro ao atualizar usuário:', err);
          alert('Erro ao atualizar usuário. Verifique se o e-mail já não está em uso.');
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
          },
          error: (err) => {
            this.isSubmitting.set(false);
            console.error('Erro ao cadastrar usuário:', err);
            alert('Erro ao cadastrar usuário. Verifique se o e-mail já está cadastrado.');
          }
        });
    }
  }

  toggleStatus(user: UserItem, event?: Event): void {
    if (event) event.stopPropagation();

    // Impede que o próprio admin logado desative a si mesmo
    if (this.currentUser()?.id === user.id) {
      alert('Você não pode desativar o seu próprio usuário logado.');
      return;
    }

    const actionText = user.isActive ? 'desativar' : 'reativar';
    if (confirm(`Deseja realmente ${actionText} a conta de "${user.name}"?`)) {
      this.usersService.updateUser(user.id, { isActive: !user.isActive }).subscribe({
        next: () => {
          this.users.update((list) =>
            list.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
          );
        },
        error: (err) => {
          console.error('Erro ao alterar status do usuário:', err);
          alert('Não foi possível alterar o status do usuário.');
        }
      });
    }
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
      alert('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    this.isSubmitting.set(true);
    this.usersService.updateUser(user.id, { password: pass }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closePasswordModal();
        alert(`Senha do usuário "${user.name}" redefinida com sucesso!`);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Erro ao redefinir senha:', err);
        alert('Não foi possível redefinir a senha.');
      }
    });
  }

  deleteUser(user: UserItem, event?: Event): void {
    if (event) event.stopPropagation();

    if (this.currentUser()?.id === user.id) {
      alert('Você não pode remover a sua própria conta conectada.');
      return;
    }

    if (confirm(`Atenção: Deseja realmente remover permanentemente o colaborador "${user.name}"?`)) {
      this.usersService.deleteUser(user.id).subscribe({
        next: () => {
          this.users.update((list) => list.filter((u) => u.id !== user.id));
        },
        error: (err) => {
          console.error('Erro ao excluir usuário:', err);
          alert('Não foi possível remover o colaborador.');
        }
      });
    }
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

