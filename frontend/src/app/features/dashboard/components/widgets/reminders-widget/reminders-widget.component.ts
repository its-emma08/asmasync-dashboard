import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../../../../core/services/storage.service';

@Component({
    selector: 'app-reminders-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, FormsModule],
    template: `
    <div class="h-full flex flex-col bg-yellow-50 p-4 relative group">
        <div class="absolute top-0 right-0 p-2 opacity-50">
            <mat-icon class="text-yellow-600 rotate-12">push_pin</mat-icon>
        </div>
        
        <h3 class="font-bold text-yellow-800 text-sm mb-2 uppercase tracking-wide">Notas Rápidas</h3>
        
        <textarea 
            [(ngModel)]="noteContent" 
            (ngModelChange)="saveNote()"
            class="flex-1 w-full bg-transparent resize-none border-none focus:ring-0 text-yellow-900 placeholder-yellow-800/50 font-handwriting text-lg leading-relaxed custom-scrollbar outline-none"
            placeholder="Escribe aquí un recordatorio..."
        ></textarea>
    </div>
  `,
    styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap');
    .font-handwriting { font-family: 'Kalam', cursive; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #eab308; border-radius: 2px; }
  `]
})
export class RemindersWidgetComponent {
    noteContent = '';

    constructor(private storageService: StorageService) {
        const saved = this.storageService.getItem('dashboard_sticky_note');
        if (saved) this.noteContent = saved;
    }

    saveNote() {
        this.storageService.setItem('dashboard_sticky_note', this.noteContent);
    }
}
