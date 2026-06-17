import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

function passwordMatchValidator(g: AbstractControl) {
    const pw = g.get('password')?.value;
    const cf = g.get('confirmPassword')?.value;
    return pw === cf ? null : { mismatch: true };
}

@Component({
    selector: 'app-invite-complete',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatButtonModule,
        MatIconModule, MatSelectModule, MatProgressSpinnerModule
    ],
    template: `
    <div class="ic-root">
        <div class="ic-card">

            <!-- Logo -->
            <div class="ic-logo">
                <div class="ic-logo-icon">
                    <mat-icon>medical_services</mat-icon>
                </div>
                <div>
                    <h1>AsmaSync</h1>
                    <p>Panel Médico</p>
                </div>
            </div>

            <!-- Loading session -->
            <div *ngIf="step() === 'loading'" class="ic-loading">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Verificando invitación...</p>
            </div>

            <!-- Error state -->
            <div *ngIf="step() === 'error'" class="ic-error">
                <mat-icon class="ic-error-icon">error_outline</mat-icon>
                <h2>Enlace inválido o expirado</h2>
                <p>El enlace de invitación ha caducado o ya fue utilizado.<br>Solicita al administrador que te envíe una nueva invitación.</p>
                <button mat-flat-button (click)="router.navigate(['/login'])">
                    Ir al inicio de sesión
                </button>
            </div>

            <!-- Setup form -->
            <div *ngIf="step() === 'form'">
                <div class="ic-welcome">
                    <h2>Bienvenido al equipo médico</h2>
                    <p>Configura tu cuenta para comenzar a usar el panel de AsmaSync.</p>
                </div>

                <form [formGroup]="form" (ngSubmit)="onSubmit()" class="ic-form">

                    <!-- Email (read-only) -->
                    <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Correo electrónico</mat-label>
                        <input matInput [value]="email()" disabled>
                        <mat-icon matPrefix>email</mat-icon>
                    </mat-form-field>

                    <!-- Nombre completo -->
                    <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Nombre completo</mat-label>
                        <input matInput formControlName="full_name" placeholder="Dr. Juan Pérez">
                        <mat-icon matPrefix>person</mat-icon>
                        <mat-error *ngIf="form.get('full_name')?.hasError('required')">Campo requerido</mat-error>
                    </mat-form-field>

                    <!-- Especialidad -->
                    <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Especialidad</mat-label>
                        <mat-select formControlName="specialty">
                            <mat-option value="neumo">Neumología</mat-option>
                            <mat-option value="alergologia">Alergología</mat-option>
                            <mat-option value="pediatria">Pediatría</mat-option>
                            <mat-option value="med_interna">Medicina Interna</mat-option>
                            <mat-option value="mf">Medicina Familiar</mat-option>
                            <mat-option value="otro">Otra especialidad</mat-option>
                        </mat-select>
                        <mat-icon matPrefix>local_hospital</mat-icon>
                    </mat-form-field>

                    <!-- Cédula profesional -->
                    <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Cédula profesional</mat-label>
                        <input matInput formControlName="license_number" placeholder="Ej. 12345678">
                        <mat-icon matPrefix>badge</mat-icon>
                        <mat-hint>Registro SEP: 7 u 8 dígitos numéricos</mat-hint>
                        <mat-error *ngIf="form.get('license_number')?.hasError('pattern')">
                            Formato inválido. Solo 7 u 8 dígitos numéricos.
                        </mat-error>
                    </mat-form-field>

                    <div formGroupName="passwords" class="ic-pw-group">
                        <!-- Contraseña -->
                        <mat-form-field appearance="outline" class="w-full">
                            <mat-label>Nueva contraseña</mat-label>
                            <input matInput formControlName="password"
                                [type]="showPw() ? 'text' : 'password'">
                            <mat-icon matPrefix>lock</mat-icon>
                            <button mat-icon-button matSuffix type="button" (click)="showPw.set(!showPw())">
                                <mat-icon>{{ showPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
                            </button>
                            <mat-hint>Mínimo 8 caracteres, 1 mayúscula y 1 número</mat-hint>
                            <mat-error *ngIf="form.get('passwords.password')?.hasError('required')">Requerida</mat-error>
                            <mat-error *ngIf="form.get('passwords.password')?.hasError('minlength')">Mínimo 8 caracteres</mat-error>
                            <mat-error *ngIf="form.get('passwords.password')?.hasError('pattern')">Debe incluir mayúscula y número</mat-error>
                        </mat-form-field>

                        <!-- Confirmar -->
                        <mat-form-field appearance="outline" class="w-full">
                            <mat-label>Confirmar contraseña</mat-label>
                            <input matInput formControlName="confirmPassword"
                                [type]="showPw() ? 'text' : 'password'">
                            <mat-icon matPrefix>lock_outline</mat-icon>
                            <mat-error *ngIf="form.get('passwords')?.hasError('mismatch')">Las contraseñas no coinciden</mat-error>
                        </mat-form-field>
                    </div>

                    <!-- Error message -->
                    <div *ngIf="errorMsg()" class="ic-error-msg">
                        <mat-icon>error</mat-icon>
                        {{ errorMsg() }}
                    </div>

                    <button mat-flat-button color="primary" type="submit"
                        [disabled]="form.invalid || isLoading()"
                        class="ic-submit-btn">
                        <mat-spinner diameter="20" *ngIf="isLoading()"></mat-spinner>
                        <mat-icon *ngIf="!isLoading()">check_circle</mat-icon>
                        {{ isLoading() ? 'Configurando cuenta...' : 'Activar cuenta' }}
                    </button>
                </form>
            </div>

            <!-- Success state -->
            <div *ngIf="step() === 'success'" class="ic-success">
                <div class="ic-success-icon">
                    <mat-icon>verified</mat-icon>
                </div>
                <h2>¡Cuenta activada!</h2>
                <p>Tu cuenta médica está lista. Redirigiendo al panel...</p>
            </div>

        </div>
    </div>
    `,
    styles: [`
        .ic-root {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f0f7ff 0%, #e8f4f8 50%, #f5f0ff 100%);
            padding: 24px;
        }
        .ic-card {
            width: 100%;
            max-width: 480px;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.6);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,122,255,0.06);
        }
        .ic-logo {
            display: flex; align-items: center; gap: 12px; margin-bottom: 32px;
        }
        .ic-logo-icon {
            width: 44px; height: 44px; border-radius: 14px;
            background: linear-gradient(135deg, #007aff, #0055cc);
            display: flex; align-items: center; justify-content: center;
            mat-icon { color: white; }
        }
        .ic-logo h1 { font-size: 20px; font-weight: 800; color: #1d1d1f; margin: 0; }
        .ic-logo p { font-size: 12px; color: #86868b; margin: 0; }

        .ic-loading {
            text-align: center; padding: 40px 0;
            p { margin-top: 16px; color: #86868b; font-size: 14px; }
        }
        .ic-error {
            text-align: center; padding: 20px 0;
            h2 { font-size: 20px; font-weight: 700; color: #1d1d1f; margin: 12px 0 8px; }
            p { font-size: 14px; color: #86868b; line-height: 1.5; margin-bottom: 20px; }
        }
        .ic-error-icon { font-size: 48px; width: 48px; height: 48px; color: #ff3b30; }

        .ic-welcome {
            margin-bottom: 24px;
            h2 { font-size: 22px; font-weight: 700; color: #1d1d1f; margin: 0 0 6px; letter-spacing: -0.03em; }
            p { font-size: 14px; color: #86868b; margin: 0; }
        }
        .ic-form { display: flex; flex-direction: column; gap: 4px; }
        .ic-pw-group { display: flex; flex-direction: column; gap: 4px; }

        .ic-error-msg {
            display: flex; align-items: center; gap: 8px;
            background: #fff0f0; border: 1px solid #ffd0d0;
            border-radius: 12px; padding: 12px 16px;
            font-size: 13px; color: #c0392b;
            mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
        }
        .ic-submit-btn {
            height: 52px !important; border-radius: 16px !important;
            font-size: 15px !important; font-weight: 700 !important;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            margin-top: 8px;
        }
        .ic-success {
            text-align: center; padding: 20px 0;
            h2 { font-size: 22px; font-weight: 700; color: #1d1d1f; margin: 16px 0 8px; }
            p { font-size: 14px; color: #86868b; }
        }
        .ic-success-icon {
            width: 72px; height: 72px; border-radius: 50%;
            background: linear-gradient(135deg, #34c759, #1a9e40);
            display: flex; align-items: center; justify-content: center; margin: 0 auto;
            mat-icon { font-size: 40px; width: 40px; height: 40px; color: white; }
        }
    `]
})
export class InviteCompleteComponent implements OnInit {

    step = signal<'loading' | 'form' | 'error' | 'success'>('loading');
    email = signal('');
    isLoading = signal(false);
    errorMsg = signal('');
    showPw = signal(false);

    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        public router: Router,
        private supabaseService: SupabaseService,
        private authService: AuthService,
        private http: HttpClient
    ) {
        this.form = this.fb.group({
            full_name: ['', Validators.required],
            specialty: ['neumo'],
            license_number: ['', [Validators.pattern(/^\d{7,8}$/)]],
            passwords: this.fb.group({
                password: ['', [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
                ]],
                confirmPassword: ['', Validators.required]
            }, { validators: passwordMatchValidator })
        });
    }

    ngOnInit(): void {
        // Supabase redirect lands here with #access_token or ?code
        this.detectInviteSession();
    }

    private async detectInviteSession(): Promise<void> {
        // Try getting session — Supabase SDK parses the hash/code automatically
        const { data, error } = await this.supabaseService.client.auth.getSession();

        if (error || !data.session) {
            // Try PKCE code exchange (newer Supabase)
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');

            if (code) {
                const { data: codeData, error: codeErr } = await this.supabaseService.client.auth.exchangeCodeForSession(code);
                if (codeErr || !codeData.session) {
                    this.step.set('error');
                    return;
                }
                this.initForm(codeData.session);
            } else {
                this.step.set('error');
            }
            return;
        }

        this.initForm(data.session);
    }

    private initForm(session: any): void {
        const user = session.user;
        const meta = user.user_metadata ?? {};
        this.email.set(user.email ?? '');

        // Pre-fill name if passed in invite metadata
        if (meta.full_name) {
            this.form.patchValue({ full_name: meta.full_name });
        }
        if (meta.specialty) {
            this.form.patchValue({ specialty: meta.specialty });
        }

        this.step.set('form');
    }

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;

        this.isLoading.set(true);
        this.errorMsg.set('');

        const { full_name, specialty, license_number, passwords } = this.form.value;
        const password = passwords.password;

        try {
            // 1. Set the password for the invited user
            const { error: pwErr } = await this.supabaseService.client.auth.updateUser({ password });
            if (pwErr) throw new Error(pwErr.message);

            // 2. Get fresh session with the new password
            const { data: sessionData } = await this.supabaseService.client.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            if (!accessToken) throw new Error('No se pudo obtener la sesión. Intenta de nuevo.');

            // 3. Register/sync user in our backend
            const backendUser = await firstValueFrom(this.http.post<any>(
                `${environment.apiUrl}/auth/register`,
                { full_name, specialty, license_number, role: 'doctor' },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            ));

            // 4. Store session in app
            this.authService.setUserFromSupabase({
                access_token: accessToken,
                email: this.email(),
                full_name: backendUser?.full_name || full_name,
                role: backendUser?.role || 'doctor',
                id: backendUser?.id || sessionData?.session?.user?.id || ''
            });

            this.step.set('success');
            setTimeout(() => this.router.navigate(['/dashboard']), 1800);

        } catch (err: any) {
            this.errorMsg.set(err?.message || 'Error al activar la cuenta. Intenta de nuevo.');
            this.isLoading.set(false);
        }
    }
}
