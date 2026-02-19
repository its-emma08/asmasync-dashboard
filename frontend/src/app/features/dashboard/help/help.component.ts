import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-help',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatExpansionModule,
        RouterModule
    ],
    template: `
        <div class="help-page">

            <!-- Header -->
            <div class="help-header">
                <button mat-icon-button routerLink="/dashboard" class="back-btn">
                    <mat-icon>arrow_back</mat-icon>
                </button>
                <div>
                    <h1>Centro de Ayuda</h1>
                    <p>Encuentra respuestas a preguntas frecuentes y guías de uso</p>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <div class="action-card">
                    <div class="action-icon" style="background: rgba(0,181,173,0.08);">
                        <mat-icon style="color: #00B5AD;">help_outline</mat-icon>
                    </div>
                    <h3>Guía Rápida</h3>
                    <p>Primeros pasos con AsmaSync</p>
                </div>
                <div class="action-card">
                    <div class="action-icon" style="background: rgba(139,92,246,0.08);">
                        <mat-icon style="color: #8b5cf6;">video_library</mat-icon>
                    </div>
                    <h3>Tutoriales</h3>
                    <p>Videos explicativos</p>
                </div>
                <div class="action-card">
                    <div class="action-icon" style="background: rgba(59,130,246,0.08);">
                        <mat-icon style="color: #3b82f6;">support_agent</mat-icon>
                    </div>
                    <h3>Soporte</h3>
                    <p>Contacta con nosotros</p>
                </div>
            </div>

            <!-- FAQ Accordion — Clean -->
            <div class="faq-section">
                <h2>Preguntas Frecuentes</h2>

                <mat-accordion>
                    <mat-expansion-panel>
                        <mat-expansion-panel-header>
                            <mat-panel-title>¿Cómo añado un nuevo paciente?</mat-panel-title>
                        </mat-expansion-panel-header>
                        <p>Ve a la sección "Pacientes" desde el menú lateral, luego haz clic en el botón
                            "Añadir Paciente". Completa el formulario de 3 pestañas con los datos personales,
                            de contacto y clínicos.</p>
                    </mat-expansion-panel>

                    <mat-expansion-panel>
                        <mat-expansion-panel-header>
                            <mat-panel-title>¿Qué significan las zonas de colores (verde, amarillo, rojo)?</mat-panel-title>
                        </mat-expansion-panel-header>
                        <p><strong>Verde:</strong> El paciente está en zona segura (PEF > 80% del mejor personal).<br>
                            <strong>Amarillo:</strong> Precaución (PEF entre 50-80%).<br>
                            <strong>Rojo:</strong> Alerta crítica (PEF < 50%), requiere intervención inmediata.</p>
                    </mat-expansion-panel>

                    <mat-expansion-panel>
                        <mat-expansion-panel-header>
                            <mat-panel-title>¿Cómo genero un reporte médico?</mat-panel-title>
                        </mat-expansion-panel-header>
                        <p>Ve a "Reportes" desde el menú lateral. Selecciona el paciente, configura las
                            opciones del reporte (tipo, fecha, gráficos) y haz clic en "Generar PDF". Puedes
                            usar el modo pantalla completa para mejor visualización.</p>
                    </mat-expansion-panel>

                    <mat-expansion-panel>
                        <mat-expansion-panel-header>
                            <mat-panel-title>¿Cómo personalizo mi dashboard?</mat-panel-title>
                        </mat-expansion-panel-header>
                        <p>Haz clic en el botón "Editar" en la esquina inferior derecha del dashboard.
                            Podrás mover widgets, cambiar su tamaño y añadir nuevos widgets personalizados.</p>
                    </mat-expansion-panel>

                    <mat-expansion-panel>
                        <mat-expansion-panel-header>
                            <mat-panel-title>¿Cómo funciona el sistema de notificaciones?</mat-panel-title>
                        </mat-expansion-panel-header>
                        <p>Las notificaciones se activan automáticamente cuando un paciente entra en zona
                            amarilla o roja. También recibirás alertas por adherencia baja al tratamiento
                            y citas próximas.</p>
                    </mat-expansion-panel>

                    <mat-expansion-panel>
                        <mat-expansion-panel-header>
                            <mat-panel-title>¿Puedo exportar los datos de pacientes?</mat-panel-title>
                        </mat-expansion-panel-header>
                        <p>Sí, desde la lista de pacientes puedes exportar a Excel o CSV. También puedes
                            generar reportes médicos en PDF con gráficos y estadísticas completas.</p>
                    </mat-expansion-panel>
                </mat-accordion>
            </div>

            <!-- Contact -->
            <div class="contact-card">
                <mat-icon>email</mat-icon>
                <div>
                    <h3>¿No encuentras lo que buscas?</h3>
                    <p>Contacta con nuestro equipo de soporte</p>
                </div>
                <button mat-raised-button color="primary">
                    <mat-icon>send</mat-icon> Enviar Mensaje
                </button>
            </div>

        </div>
    `,
    styles: [`
        .help-page {
            padding: 32px;
            max-width: 100%;
            min-height: calc(100vh - 64px);
        }

        .help-header {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 28px;
        }
        .back-btn {
            border-radius: 12px !important;
        }
        .help-header h1 {
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
        }
        .help-header p {
            font-size: 14px;
            color: #64748b;
            margin: 2px 0 0;
        }

        /* Quick Actions */
        .quick-actions {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 32px;
        }
        .action-card {
            background: white;
            border: 1px solid #f1f5f9;
            border-radius: 24px;
            padding: 28px 24px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.03);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            cursor: pointer;
        }
        .action-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.06);
        }
        .action-icon {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 14px;
        }
        .action-icon mat-icon {
            font-size: 24px;
            width: 24px;
            height: 24px;
        }
        .action-card h3 {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 4px;
        }
        .action-card p {
            font-size: 13px;
            color: #94a3b8;
            margin: 0;
        }

        /* FAQ section */
        .faq-section {
            margin-bottom: 32px;
        }
        .faq-section h2 {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 16px;
        }

        ::ng-deep .faq-section .mat-expansion-panel {
            background: white !important;
            border-radius: 18px !important;
            border: 1px solid #f1f5f9 !important;
            box-shadow: none !important;
            margin-bottom: 8px !important;
        }
        ::ng-deep .faq-section .mat-expansion-panel::before {
            display: none !important;
        }
        ::ng-deep .faq-section .mat-expansion-panel-header {
            font-weight: 600 !important;
            font-size: 14px !important;
            color: #0f172a !important;
            border-radius: 18px !important;
            padding: 0 20px !important;
        }
        ::ng-deep .faq-section .mat-expansion-panel-header:hover {
            background: #f8fafc !important;
        }
        ::ng-deep .faq-section .mat-expansion-panel-body {
            padding: 0 20px 16px !important;
        }
        ::ng-deep .faq-section .mat-expansion-panel-body p {
            font-size: 14px;
            color: #475569;
            line-height: 1.7;
            margin: 0;
        }

        /* Contact */
        .contact-card {
            display: flex;
            align-items: center;
            gap: 16px;
            background: white;
            border: 1px solid #f1f5f9;
            border-radius: 24px;
            padding: 28px 32px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        }
        .contact-card > mat-icon {
            font-size: 36px;
            width: 36px;
            height: 36px;
            color: #00B5AD;
        }
        .contact-card > div { flex: 1; }
        .contact-card h3 {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 2px;
        }
        .contact-card p {
            font-size: 13px;
            color: #64748b;
            margin: 0;
        }
    `]
})
export class HelpComponent { }
