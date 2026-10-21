import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  showPassword = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.toastService.success('Seja bem-vindo ao Ampernet Hub!', 'Login efetuado');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Falha na autenticação:', err);
        if (err.status === 429) {
          this.toastService.error(
            'Muitas tentativas consecutivas de acesso. Por segurança, aguarde 1 minuto e tente novamente.',
            'Bloqueio Temporário'
          );
        } else if (err.status === 401) {
          const message = err.error?.message || 'E-mail ou senha incorretos.';
          this.toastService.error(message, 'Falha no Acesso');
        } else {
          this.toastService.error('Erro de conexão com o servidor. Tente novamente mais tarde.', 'Falha no Acesso');
        }
      }
    });
  }
}