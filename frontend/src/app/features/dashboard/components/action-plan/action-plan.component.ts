import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';

interface PlanStep {
    id: number;
    title: string;
    description: string;
    category: 'medication' | 'lifestyle' | 'monitoring';
    icon: string;
}

@Component({
    selector: 'app-action-plan',
    standalone: true,
    imports: [
        CommonModule,
        DragDropModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatStepperModule
    ],
    templateUrl: './action-plan.component.html',
    styleUrls: ['./action-plan.component.scss']
})
export class ActionPlanComponent {
    @Input() currentStage: number = 1; // 0-indexed or 1-indexed? Let's use 0-indexed for stepper

    stages = [
        { label: 'Diagnóstico', state: 'completed' },
        { label: 'Inicio de Tratamiento', state: 'current' },
        { label: 'Estabilización', state: 'pending' },
        { label: 'Mantenimiento', state: 'pending' }
    ];

    planSteps: PlanStep[] = [
        { id: 1, title: 'Inhalador de Rescate', description: 'Usar 2 disparos cada 4 horas si hay síntomas.', category: 'medication', icon: 'medication' },
        { id: 2, title: 'Registro de FEM', description: 'Medir flujo espiratorio cada mañana antes de medicación.', category: 'monitoring', icon: 'speed' },
        { id: 3, title: 'Evitar Alérgenos', description: 'Mantener ventanas cerradas en días de alto polen.', category: 'lifestyle', icon: 'block' },
        { id: 4, title: 'Cita de Seguimiento', description: 'Programar cita con neumólogo en 2 semanas.', category: 'monitoring', icon: 'calendar_today' }
    ];

    drop(event: CdkDragDrop<PlanStep[]>) {
        moveItemInArray(this.planSteps, event.previousIndex, event.currentIndex);
    }

    getCategoryColor(category: string): string {
        switch (category) {
            case 'medication': return 'text-blue-500 bg-blue-50';
            case 'lifestyle': return 'text-green-500 bg-green-50';
            case 'monitoring': return 'text-purple-500 bg-purple-50';
            default: return 'text-gray-500 bg-gray-50';
        }
    }
}
