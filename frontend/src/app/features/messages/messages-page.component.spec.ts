import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessagesPageComponent } from './messages-page.component';
import { ChatService } from '../../core/services/chat.service';
import { PatientService } from '../../core/services/patient.service';
import { AuthService } from '../../core/services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { Conversation, ChatMessage } from '../../core/models/chat.model';
import { Patient } from '../../core/models/patient.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('MessagesPageComponent', () => {
    let component: MessagesPageComponent;
    let fixture: ComponentFixture<MessagesPageComponent>;

    const chatStub = {
        conversations$: new BehaviorSubject<Conversation[]>([]),
        messages: (id: number) => new BehaviorSubject<ChatMessage[]>([]).asObservable(),
        connect: () => undefined,
        loadConversations: () => Promise.resolve(),
        open: (id: number) => Promise.resolve(),
        createConversation: (id: number) => Promise.resolve({ id } as Conversation),
        send: (id: number, content: string) => Promise.resolve(null),
        loadOlder: (id: number) => Promise.resolve(),
        hasMore: (id: number) => false,
    };

    const authStub = { currentUserValue: { id: 1, role: 'doctor' } };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessagesPageComponent, HttpClientTestingModule],
            providers: [
                { provide: ChatService, useValue: chatStub },
                {
                    provide: PatientService,
                    useValue: { getAllPatients: () => new BehaviorSubject<Patient[]>([]).asObservable() }
                },
                { provide: AuthService, useValue: authStub }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MessagesPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('crea el componente', () => {
        expect(component).toBeTruthy();
    });

    it('asigna el id del usuario actual al iniciar', () => {
        expect(component.myId).toBe(1);
    });

    it('muestra el mensaje vacío sin conversaciones', () => {
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('.conv-empty')).toBeTruthy();
    });

    it('preview() devuelve "Sin mensajes" cuando no hay último mensaje', () => {
        const conv = { last_message: null } as Conversation;
        expect(component.preview(conv)).toBe('Sin mensajes');
    });

    it('filtra los pacientes pendientes excluyendo los que ya tienen conversación', () => {
        const conv = {
            other_participant: { id: 2 } as any
        } as Conversation;
        component.conversations = [conv];
        component.patients = [
            { id: 2, full_name: 'Ana García' } as Patient,
            { id: 3, full_name: 'Luis Pérez' } as Patient
        ];
        expect(component.filteredPatients.length).toBe(1);
        expect(component.filteredPatients[0].full_name).toBe('Luis Pérez');
    });
});