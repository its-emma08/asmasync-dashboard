import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, takeUntil, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ChatSocketService } from './chat-socket.service';
import { ChatMessage, Conversation, PaginatedMessages } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
    private readonly BASE = `${environment.apiUrl}/chat`;

    private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
    public conversations$ = this.conversationsSubject.asObservable();

    private unreadSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadSubject.asObservable();

    private activeConversationId: number | null = null;
    private messagesMap = new Map<number, BehaviorSubject<ChatMessage[]>>();
    private hasMoreMap = new Map<number, boolean>();
    private loadedMap = new Map<number, boolean>();
    private destroy$ = new Subject<void>();

    constructor(
        private http: HttpClient,
        private auth: AuthService,
        private socket: ChatSocketService
    ) {
        this.socket.messages$.pipe(takeUntil(this.destroy$)).subscribe(msg => this.onSocketMessage(msg));
    }

    get currentUserId(): number | null {
        const id = this.auth.currentUserValue?.id;
        return id != null ? Number(id) : null;
    }

    connect(): void {
        this.socket.connect();
    }

    messages(conversationId: number): Observable<ChatMessage[]> {
        return this.messagesSubject(conversationId).asObservable();
    }

    hasMore(conversationId: number): boolean {
        return this.hasMoreMap.get(conversationId) ?? false;
    }

    async loadConversations(): Promise<void> {
        try {
            const list = await firstValueFrom(this.http.get<Conversation[]>(`${this.BASE}/conversations`));
            this.conversationsSubject.next(list);
        } catch (e) {
            this.conversationsSubject.next([]);
        }
        this.refreshUnread();
    }

    async open(conversationId: number): Promise<void> {
        this.activeConversationId = conversationId;
        if (!this.loadedMap.get(conversationId)) {
            await this.loadMessages(conversationId, true);
        }
        this.markRead(conversationId);
    }

    async loadMessages(conversationId: number, reset: boolean = false): Promise<void> {
        if (reset) {
            this.loadedMap.set(conversationId, true);
            const page = await firstValueFrom(this.http.get<PaginatedMessages>(
                `${this.BASE}/conversations/${conversationId}/messages`
            ));
            this.messagesSubject(conversationId).next(page.messages);
            this.hasMoreMap.set(conversationId, page.has_more);
            return;
        }
        const current = this.messagesSubject(conversationId).value;
        if (!current.length) return;
        const oldestId = current[0].id;
        const page = await firstValueFrom(this.http.get<PaginatedMessages>(
            `${this.BASE}/conversations/${conversationId}/messages?before_id=${oldestId}`
        ));
        this.hasMoreMap.set(conversationId, page.has_more);
        this.messagesSubject(conversationId).next([...page.messages, ...current]);
    }

    loadOlder(conversationId: number): Promise<void> {
        return this.loadMessages(conversationId, false);
    }

    async createConversation(patientId: number): Promise<Conversation> {
        const conv = await firstValueFrom(this.http.post<Conversation>(`${this.BASE}/conversations`, { patient_id: patientId }));
        const list = this.conversationsSubject.value.filter(c => c.id !== conv.id);
        this.conversationsSubject.next([conv, ...list]);
        this.messagesSubject(conv.id);
        this.refreshUnread();
        return conv;
    }

    async send(conversationId: number, content: string): Promise<ChatMessage | null> {
        const me = this.currentUserId;
        if (!me || !content.trim()) return null;
        const optimistic: ChatMessage = {
            id: -Date.now(),
            conversation_id: conversationId,
            sender_id: me,
            recipient_id: 0,
            content,
            is_read: false,
            created_at: new Date().toISOString()
        };
        const subj = this.messagesSubject(conversationId);
        subj.next([...subj.value, optimistic]);
        this.touchConversation(conversationId, optimistic);

        try {
            const saved = await firstValueFrom(this.http.post<ChatMessage>(
                `${this.BASE}/messages`,
                { conversation_id: conversationId, content }
            ));
            subj.next(subj.value.map(m => m.id === optimistic.id ? saved : m));
            this.touchConversation(conversationId, saved);
            return saved;
        } catch (e) {
            subj.next(subj.value.filter(m => m.id !== optimistic.id));
            return null;
        }
    }

    async markRead(conversationId: number): Promise<void> {
        try {
            await firstValueFrom(this.http.patch(`${this.BASE}/conversations/${conversationId}/read`, {}));
        } catch (e) { /* noop */ }
        const subj = this.messagesSubject(conversationId);
        subj.next(subj.value.map(m => ({ ...m, is_read: true })));
        const list = this.conversationsSubject.value.map(c =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c
        );
        this.conversationsSubject.next(list);
        this.refreshUnread();
    }

    private refreshUnread(): void {
        const total = this.conversationsSubject.value.reduce((a, c) => a + (c.unread_count ?? 0), 0);
        this.unreadSubject.next(total);
    }

    private touchConversation(conversationId: number, message: ChatMessage): void {
        const list = this.conversationsSubject.value.map(c =>
            c.id === conversationId
                ? { ...c, last_message: message, last_message_at: message.created_at ?? null }
                : c
        );
        if (list.length) this.conversationsSubject.next(list);
        this.refreshUnread();
    }

    private onSocketMessage(msg: any): void {
        if (msg?.type === 'chat_message') this.handleIncoming(msg);
        else if (msg?.type === 'chat_read') this.handleRead(msg);
    }

    private handleIncoming(msg: any): void {
        const message: ChatMessage = msg?.message;
        if (!message) return;
        const convId = message.conversation_id;
        const subj = this.messagesSubject(convId);
        if (!subj.value.some(m => m.id === message.id)) {
            subj.next([...subj.value, message]);
        }
        const me = this.currentUserId;
        const isMine = message.sender_id === me;
        const existing = this.conversationsSubject.value.find(c => c.id === convId);
        if (existing) {
            const isActive = this.activeConversationId === convId;
            this.conversationsSubject.next(this.conversationsSubject.value.map(c => {
                if (c.id !== convId) return c;
                const unread = isMine ? c.unread_count : c.unread_count + 1;
                return { ...c, last_message: message, last_message_at: message.created_at ?? null, unread_count: unread };
            }));
            if (!isMine && isActive) this.markRead(convId);
        } else {
            this.loadConversations();
        }
        this.refreshUnread();
    }

    private handleRead(msg: any): void {
        const convId = msg?.conversation_id;
        if (!convId) return;
        const me = this.currentUserId;
        const subj = this.messagesSubject(convId);
        subj.next(subj.value.map(m => (m.sender_id === me ? { ...m, is_read: true } : m)));
    }

    private messagesSubject(conversationId: number): BehaviorSubject<ChatMessage[]> {
        if (!this.messagesMap.has(conversationId)) {
            this.messagesMap.set(conversationId, new BehaviorSubject<ChatMessage[]>([]));
        }
        return this.messagesMap.get(conversationId)!;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}