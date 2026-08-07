import { Component, OnInit, OnDestroy, AfterViewChecked, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { PatientService } from '../../core/services/patient.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatMessage, Conversation } from '../../core/models/chat.model';
import { Patient } from '../../core/models/patient.model';

@Component({
    selector: 'app-messages-page',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, FormsModule, ReactiveFormsModule],
    template: `
    <div class="messages-shell">

        <aside class="conv-panel">
            <div class="conv-head">
                <div class="conv-title">
                    <h2>Mensajes</h2>
                    <button (click)="patientBox = !patientBox" mat-icon-button class="add-btn"
                        title="Nuevo chat con paciente">
                        <mat-icon>add_comment</mat-icon>
                    </button>
                </div>
                <div *ngIf="patientBox" class="patient-box">
                    <div class="patient-filter">
                        <mat-icon>search</mat-icon>
                        <input type="text" placeholder="Buscar paciente..." [formControl]="patientFilterCtrl">
                    </div>
                    <button *ngFor="let p of filteredPatients" class="patient-row"
                        (click)="startChat(p)">
                        <span class="avatar">{{ (p.full_name || '?').charAt(0).toUpperCase() }}</span>
                        <span>{{ p.full_name }}</span>
                    </button>
                    <div *ngIf="filteredPatients.length === 0" class="patient-empty">Sin pacientes pendientes</div>
                </div>
            </div>

            <div class="conv-scroll">
                <button *ngFor="let c of conversations" (click)="select(c)"
                    class="conv-item" [class.active]="selectedId === c.id">
                    <span class="avatar">{{ (c.other_participant.full_name || '?').charAt(0).toUpperCase() }}</span>
                    <span class="conv-meta">
                        <span class="conv-row">
                            <span class="conv-name">{{ c.other_participant.full_name }}</span>
                            <span class="conv-time">{{ time(c.last_message?.created_at) }}</span>
                        </span>
                        <span class="conv-preview">{{ preview(c) }}</span>
                    </span>
                    <span *ngIf="c.unread_count > 0" class="conv-badge">{{ c.unread_count }}</span>
                </button>
                <div *ngIf="conversations.length === 0" class="conv-empty">
                    <mat-icon>forum</mat-icon>
                    <p>Sin conversaciones aún.<br>Toca + e inicia un chat con un paciente.</p>
                </div>
            </div>
        </aside>

        <section class="chat-window" *ngIf="selectedId != null && activeConversation">
            <div class="chat-head">
                <div>
                    <span class="chat-name">{{ activeConversation.other_participant.full_name }}</span>
                    <span class="chat-role">{{ roleLabel(activeConversation.other_participant.role) }}</span>
                </div>
                <button mat-icon-button (click)="loadOlder()" [disabled]="!chatService.hasMore(selectedId)"
                    title="Cargar mensajes anteriores">
                    <mat-icon>expand_more</mat-icon>
                </button>
            </div>

            <div #scroll class="chat-scroll">
                <div *ngFor="let m of messages" class="bubble-row" [class.mine]="m.sender_id === myId">
                    <div class="bubble">
                        {{ m.content }}
                        <span class="bubble-meta" *ngIf="m.sender_id === myId">
                            <mat-icon class="tick">{{ m.is_read ? 'done_all' : 'done' }}</mat-icon>
                        </span>
                    </div>
                </div>
                <div *ngIf="messages.length === 0" class="empty-inline">Envía el primer mensaje</div>
            </div>

            <form class="chat-input" autocomplete="off" (submit)="send($event)">
                <input type="text" [formControl]="draftCtrl" placeholder="Escribe un mensaje...">
                <button type="submit" mat-icon-button [disabled]="!draftCtrl.value?.trim()">
                    <mat-icon>send</mat-icon>
                </button>
            </form>
        </section>

        <section class="chat-window chat-empty" *ngIf="selectedId == null">
            <mat-icon class="big">forum</mat-icon>
            <p>Selecciona una conversación para leer y responder los mensajes de tus pacientes.</p>
        </section>
    </div>
  `,
    styles: [`
        :host { display: block; height: 100%; }
        .messages-shell { display: grid; grid-template-columns: 320px 1fr; height: 100%; gap: 14px; padding: 14px; }

        /* Panel de conversaciones */
        .conv-panel { display: flex; flex-direction: column; background: rgba(255,255,255,0.66);
            border: 1px solid rgba(148,163,184,0.18); border-radius: 18px; overflow: hidden; min-height: 0; box-shadow: 0 8px 30px rgba(2,6,23,0.05); }
        :host-context(body.dark) .conv-panel { background: rgba(15,23,42,0.6); border-color: rgba(255,255,255,0.08); }

        .conv-head { padding: 12px 12px 8px; border-bottom: 1px solid rgba(148,163,184,0.14); flex-shrink: 0; }
        .conv-title { display: flex; align-items: center; justify-content: space-between; }
        .conv-title h2 { margin: 0; font-size: 15px; font-weight: 800; }
        .add-btn { width: 30px; height: 30px; }
        .add-btn mat-icon { font-size: 18px; }

        .patient-box { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; }
        .patient-filter { display: flex; align-items: center; gap: 6px; background: rgba(148,163,184,0.12);
            border-radius: 10px; padding: 4px 8px; }
        .patient-filter mat-icon { font-size: 15px; width: 15px; height: 15px; color: #94a3b8; }
        .patient-filter input { flex: 1; background: transparent; border: none; outline: none; font-size: 12px; }
        .patient-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 10px;
            cursor: pointer; text-align: left; font-size: 12px; font-weight: 600; background: transparent; border: none; }
        .patient-row:hover { background: rgba(26,111,232,0.08); }
        .patient-empty { font-size: 11px; color: #94a3b8; padding: 6px 8px; }

        .conv-scroll { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
        .conv-item { display: flex; align-items: center; gap: 10px; padding: 9px; border-radius: 13px; cursor: pointer;
            background: transparent; border: none; width: 100%; text-align: left; position: relative; }
        .conv-item:hover { background: rgba(148,163,184,0.1); }
        .conv-item.active { background: rgba(0,113,227,0.1); }
        .avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: 14px; color: #fff; background: linear-gradient(135deg, #2563eb, #06b6d4); flex-shrink: 0; }
        .conv-meta { flex: 1; min-width: 0; }
        .conv-row { display: flex; justify-content: space-between; gap: 6px; }
        .conv-name { font-size: 13px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        :host-context(body.dark) .conv-name { color: #f1f5f9; }
        .conv-time { font-size: 10px; color: #94a3b8; flex-shrink: 0; }
        .conv-preview { font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .conv-badge { position: absolute; right: 12px; bottom: 12px; background: #ff453a; color: #fff; font-size: 10px;
            font-weight: 800; border-radius: 999px; min-width: 18px; height: 18px; display: flex; align-items: center;
            justify-content: center; padding: 0 5px; }
        .conv-empty { color: #94a3b8; text-align: center; font-size: 12px; padding: 24px 10px; }
        .conv-empty mat-icon { font-size: 32px; opacity: .4; }

        /* Ventana de chat */
        .chat-window { display: flex; flex-direction: column; background: rgba(255,255,255,0.66);
            border: 1px solid rgba(148,163,184,0.18); border-radius: 18px; overflow: hidden; min-height: 0; box-shadow: 0 8px 30px rgba(2,6,23,0.05); }
        :host-context(body.dark) .chat-window { background: rgba(15,23,42,0.6); border-color: rgba(255,255,255,0.08); }

        .chat-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; flex-shrink: 0;
            border-bottom: 1px solid rgba(148,163,184,0.14); }
        .chat-name { font-size: 15px; font-weight: 800; color: #1e293b; }
        :host-context(body.dark) .chat-name { color: #f1f5f9; }
        .chat-role { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; display: block; }

        .chat-scroll { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
        .bubble-row { display: flex; }
        .bubble-row.mine { justify-content: flex-end; }
        .bubble { max-width: 72%; background: #eef2f7; color: #1e293b; border-radius: 16px; padding: 9px 13px;
            font-size: 13px; line-height: 1.4; }
        :host-context(body.dark) .bubble { background: rgba(30,41,59,0.85); color: #f1f5f9; }
        .bubble-row.mine .bubble { background: #2563eb; color: #fff; border-bottom-right-radius: 4px; }
        .bubble-meta { margin-left: 6px; }
        .tick { font-size: 13px; width: 13px; height: 13px; }

        .chat-input { display: flex; gap: 10px; padding: 12px 14px; border-radius: 16px;
            background: rgba(148,163,184,0.12); margin: 0 14px 14px; flex-shrink: 0; }
        .chat-input input { flex: 1; background: transparent; border: none; outline: none; font-size: 13px; color: #1e293b; }
        :host-context(body.dark) .chat-input input { color: #f1f5f9; }
        .empty-inline { padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }

        .chat-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
            color: #94a3b8; text-align: center; }
        .chat-empty .big { font-size: 44px; opacity: .35; height: 44px; width: 44px; }
    `]
})
export class MessagesPageComponent implements OnInit, OnDestroy, AfterViewChecked {
    conversations: Conversation[] = [];
    messages: ChatMessage[] = [];
    patients: Patient[] = [];
    selectedId: number | null = null;
    activeConversation: Conversation | null = null;
    myId: number | null = null;
    patientBox = false;

    patientFilterCtrl = new FormControl<string>('');
    draftCtrl = new FormControl<string>('');

    @ViewChild('scroll') private scrollEl?: ElementRef<HTMLDivElement>;
    private destroy$ = new Subject<void>();
    private shouldScroll = false;

    constructor(
        public chatService: ChatService,
        private patientService: PatientService,
        private auth: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        const id = this.auth.currentUserValue?.id;
        this.myId = id != null ? Number(id) : null;
        this.chatService.connect();
        this.chatService.loadConversations();

        this.chatService.conversations$.pipe(takeUntil(this.destroy$)).subscribe(list => {
            this.conversations = list;
            if (this.selectedId != null) {
                this.activeConversation = list.find(c => c.id === this.selectedId) ?? null;
            }
            this.shouldScroll = true;
            this.cdr.markForCheck();
        });

        this.patientService.getAllPatients().subscribe(ps => this.patients = ps || []);
        this.patientFilterCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck());
    }

    get filteredPatients(): Patient[] {
        const q = (this.patientFilterCtrl.value ?? '').toLowerCase().trim();
        const pool = this.patients.filter(p => (p.full_name ?? '').toLowerCase().includes(q));
        const known = new Set(this.conversations.map(c => c.other_participant.id));
        return pool.filter(p => !known.has(Number(p.id)));
    }

    select(c: Conversation): void {
        this.selectedId = c.id;
        this.activeConversation = c;
        this.patientBox = false;
        this.chatService.messages(c.id).pipe(takeUntil(this.destroy$)).subscribe(msgs => {
            this.messages = msgs;
            this.shouldScroll = true;
            this.cdr.markForCheck();
        });
        this.chatService.open(c.id).then(() => { this.shouldScroll = true; });
    }

    startChat(p: Patient): void {
        const id = Number(p.id);
        this.chatService.createConversation(id).then(conv => {
            this.patientFilterCtrl.setValue('');
            this.patientBox = false;
            this.select(conv);
        });
    }

    send(ev: Event): void {
        ev.preventDefault();
        const content = this.draftCtrl.value?.toString()?.trim() ?? '';
        if (!content || this.selectedId == null) return;
        this.chatService.send(this.selectedId, content).then(() => {
            this.draftCtrl.setValue('');
            this.shouldScroll = true;
        });
    }

    loadOlder(): void {
        if (this.selectedId != null) {
            this.shouldScroll = false;
            this.chatService.loadOlder(this.selectedId);
        }
    }

    preview(c: Conversation): string {
        const lm = c.last_message;
        if (!lm) return 'Sin mensajes';
        return (lm.sender_id === this.myId ? 'Tú: ' : '') + lm.content;
    }

    roleLabel(role: string): string {
        const map: Record<string, string> = { doctor: 'Médico', patient: 'Paciente', nurse: 'Enfermero/a' };
        return map[role] ?? role;
    }

    time(iso?: string | null): string {
        if (!iso) return '';
        const d = new Date(iso);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    }

    ngAfterViewChecked(): void {
        if (this.shouldScroll && this.scrollEl?.nativeElement) {
            this.scrollEl.nativeElement.scrollTop = this.scrollEl.nativeElement.scrollHeight;
            this.shouldScroll = false;
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}