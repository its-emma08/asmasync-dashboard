import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../../../../core/services/storage.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

interface NoteColor {
    id: string;
    hex: string;
    class: string;
}

@Component({
    selector: 'app-reminders-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, FormsModule],
    templateUrl: './reminders-widget.component.html',
    styleUrls: ['./reminders-widget.component.scss']
})
export class RemindersWidgetComponent implements OnDestroy {
    private destroy$ = new Subject<void>();
    noteContent = '';
    justSaved = false;

    // Color Options
    noteColors: NoteColor[] = [
        { id: 'yellow', hex: '#fef08a', class: 'bg-yellow-postit' },
        { id: 'blue', hex: '#bae6fd', class: 'bg-blue-postit' },
        { id: 'pink', hex: '#fbcfe8', class: 'bg-pink-postit' },
        { id: 'green', hex: '#bbf7d0', class: 'bg-green-postit' }
    ];

    currentNoteColor = 'bg-yellow-postit';
    private contentSubject = new Subject<string>();

    constructor(private storageService: StorageService) {
        // Load Content
        const saved = this.storageService.getItem('dashboard_sticky_note');
        if (saved) this.noteContent = saved;

        // Load Color
        const savedColor = this.storageService.getItem('dashboard_sticky_color');
        if (savedColor) this.currentNoteColor = savedColor;

        // Setup Auto-save Debounce (500ms)
        this.contentSubject.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(content => {
            this.saveNote(content);
        });
    }


    onContentChange() {
        this.contentSubject.next(this.noteContent);
    }

    setNoteColor(color: NoteColor) {
        this.currentNoteColor = color.class;
        this.storageService.setItem('dashboard_sticky_color', color.class);
    }

    getNoteColor(className: string): string {
        return className;
    }

    saveNote(content: string) {
        this.storageService.setItem('dashboard_sticky_note', content);
        this.showSavedIndicator();
    }

    showSavedIndicator() {
        this.justSaved = true;
        setTimeout(() => this.justSaved = false, 2000);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
