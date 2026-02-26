import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ErrorStateMatcher } from '@angular/material/core';

export class ImmediateErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-slate-800 m-0">Editar Perfil</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="text-slate-400 hover:text-slate-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="profileForm" (ngSubmit)="save()">
        <div class="flex flex-col gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nombre Completo</mat-label>
            <input matInput formControlName="full_name" placeholder="Dr. Nombre Apellido" [errorStateMatcher]="matcher">
            <mat-icon matPrefix class="text-slate-400 mr-2">person</mat-icon>
            <mat-error *ngIf="profileForm.get('full_name')?.hasError('required')">El nombre es requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Correo Electrónico</mat-label>
            <input matInput formControlName="email" type="email" [errorStateMatcher]="matcher">
            <mat-icon matPrefix class="text-slate-400 mr-2">email</mat-icon>
            <mat-error *ngIf="profileForm.get('email')?.hasError('required')">El correo es requerido</mat-error>
            <mat-error *ngIf="profileForm.get('email')?.hasError('email')">Formato de correo inválido</mat-error>
          </mat-form-field>

          <div class="grid grid-cols-2 gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Especialidad</mat-label>
              <input matInput formControlName="specialty" placeholder="Neumología">
              <mat-icon matPrefix class="text-slate-400 mr-2">medical_services</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Teléfono</mat-label>
              <input matInput formControlName="phone" placeholder="555-123-4567">
              <mat-icon matPrefix class="text-slate-400 mr-2">phone</mat-icon>
            </mat-form-field>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button mat-button type="button" (click)="dialogRef.close()" class="!font-bold">Cancelar</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="profileForm.invalid || isSaving" class="!rounded-full px-6">
            <mat-icon *ngIf="!isSaving" class="mr-1">save</mat-icon>
            <mat-icon *ngIf="isSaving" class="mr-1 animate-spin">refresh</mat-icon>
            {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 500px;
      width: 100vw;
    }
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
        border-radius: 24px !important;
    }
  `]
})
export class EditProfileModalComponent {
  profileForm: FormGroup;
  isSaving = false;
  matcher = new ImmediateErrorStateMatcher();

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditProfileModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.profileForm = this.fb.group({
      full_name: [data.user?.full_name || '', Validators.required],
      email: [data.user?.email || '', [Validators.required, Validators.email]],
      specialty: [data.user?.specialty || ''],
      phone: [data.user?.phone || '']
    });
  }

  save() {
    if (this.profileForm.valid) {
      this.isSaving = true;
      const updatedData = this.profileForm.value;

      this.authService.updateProfile(updatedData).subscribe({
        next: (updatedUser: any) => {
          this.isSaving = false;
          this.dialogRef.close(updatedUser);
        },
        error: (err: any) => {
          this.isSaving = false;
          const msg = err.error?.detail?.[0]?.msg || err.error?.detail || 'Error al actualizar el perfil';
          this.toastService.showError(msg);
        }
      });
    }
  }
}
