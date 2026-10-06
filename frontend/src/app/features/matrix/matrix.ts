import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResponsibilitiesService, ResponsibilityItem } from '../../core/services/responsibilities';
import { AuthService } from '../../core/services/auth';
import { ToastService } from '../../core/services/toast';
import { ConfirmService } from '../../core/services/confirm';

@Component({
  selector: 'app-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './matrix.html',
  styleUrls: ['./matrix.scss'],
})
export class Matrix implements OnInit {
  private responsibilitiesService = inject(ResponsibilitiesService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  currentUser = this.authService.currentUser;
  responsibilities = signal<ResponsibilityItem[]>([]);

  cityFilter = signal('');
  sectorFilter = signal('');
  searchFilter = signal('');

  canManage = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'supervisor';
  });

  filteredResponsibilities = computed(() => {
    const city = this.cityFilter().trim().toLowerCase();
    const sector = this.sectorFilter().trim().toLowerCase();
    const search = this.searchFilter().trim().toLowerCase();

    return this.responsibilities().filter((item) => {
      const matchCity = !city || item.city.toLowerCase().includes(city);
      const matchSector = !sector || item.sector.toLowerCase().includes(sector);
      const matchSearch =
        !search ||
        item.responsible.toLowerCase().includes(search) ||
        (item.ramal && item.ramal.toLowerCase().includes(search)) ||
        (item.email && item.email.toLowerCase().includes(search));

      return matchCity && matchSector && matchSearch;
    });
  });

  isModalOpen = signal(false);
  editingId = signal<number | null>(null);
  formCity = signal('');
  formSector = signal('NOC');
  formResponsible = signal('');
  formRamal = signal('');
  formEmail = signal('');
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.loadResponsibilities();
  }

  loadResponsibilities(): void {
    this.responsibilitiesService.getResponsibilities().subscribe({
      next: (data) => this.responsibilities.set(data),
      error: (err) => console.error('Erro ao carregar matriz de responsabilidades:', err),
    });
  }

  openCreateModal(): void {
    this.editingId.set(null);
    this.formCity.set('');
    this.formSector.set('NOC');
    this.formResponsible.set('');
    this.formRamal.set('');
    this.formEmail.set('');
    this.isModalOpen.set(true);
  }

  openEditModal(item: ResponsibilityItem, event?: Event): void {
    if (event) event.stopPropagation();

    this.editingId.set(item.id);
    this.formCity.set(item.city);
    this.formSector.set(item.sector);
    this.formResponsible.set(item.responsible);
    this.formRamal.set(item.ramal || '');
    this.formEmail.set(item.email || '');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingId.set(null);
  }

  submitForm(): void {
    if (!this.formCity().trim() || !this.formSector().trim() || !this.formResponsible().trim()) {
      this.toastService.warning('Por favor, preencha a Cidade, Setor e o Nome do Responsável.', 'Campos Obrigatórios');
      return;
    }

    this.isSubmitting.set(true);
    const id = this.editingId();

    const payload = {
      city: this.formCity().trim(),
      sector: this.formSector().trim(),
      responsible: this.formResponsible().trim(),
      ramal: this.formRamal().trim() || null,
      email: this.formEmail().trim() || null,
    };

    if (id) {
      this.responsibilitiesService.updateResponsibility(id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadResponsibilities();
          this.toastService.success('Dados do responsável atualizados com sucesso!', 'Matriz');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Erro ao atualizar responsável:', err);
          this.toastService.error('Erro ao atualizar dados na matriz.', 'Erro');
        },
      });
    } else {
      this.responsibilitiesService.createResponsibility(payload as any).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadResponsibilities();
          this.toastService.success('Responsável cadastrado com sucesso na matriz!', 'Cadastrado');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Erro ao cadastrar na matriz:', err);
          this.toastService.error('Erro ao cadastrar responsável na matriz.', 'Erro');
        },
      });
    }
  }

  deleteItem(item: ResponsibilityItem, event?: Event): void {
    if (event) event.stopPropagation();

    this.confirmService.confirm({
      title: 'Remover da Matriz',
      message: `Deseja realmente remover o responsável "${item.responsible}" da cidade de ${item.city}?`,
      confirmText: 'Sim, Remover',
      cancelText: 'Cancelar',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.responsibilitiesService.deleteResponsibility(item.id).subscribe({
          next: () => {
            this.responsibilities.update((list) => list.filter((r) => r.id !== item.id));
            this.toastService.success('Responsável removido da matriz com sucesso.', 'Removido');
          },
          error: (err) => {
            console.error('Erro ao remover responsável:', err);
            this.toastService.error('Não foi possível remover da matriz.', 'Erro');
          },
        });
      }
    });
  }
}
