import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwPush } from '@angular/service-worker';
import { Subject, of, throwError } from 'rxjs';

import { NotificationService } from './notification.service';
import { WebSocketService } from './websocket.service';
import { Alert } from '../models/alert.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 1,
    patient_id: 1,
    alert_type: 'moderate',
    message: 'Test alert',
    created_at: new Date().toISOString(),
    is_viewed: false,
    patient: { id: 1, full_name: 'Paciente Test', risk_level: 'yellow' },
    ...overrides,
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('NotificationService', () => {
  let service: NotificationService;
  let mockMessages$: Subject<any>;
  let mockHttp: { get: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockMessages$ = new Subject<any>();

    mockHttp = {
      // First call: GET /notifications (loadFromApi)
      // Subsequent calls: GET /alerts/unread-count (refreshUnreadCount)
      get: vi.fn()
        .mockReturnValueOnce(of([]))
        .mockReturnValue(of({ count: 0 })),
      patch: vi.fn().mockReturnValue(of({ success: true })),
    };

    mockSnackBar = { open: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: HttpClient,      useValue: mockHttp },
        { provide: SwPush,          useValue: { isEnabled: false } },
        { provide: MatSnackBar,     useValue: mockSnackBar },
        { provide: WebSocketService, useValue: { messages$: mockMessages$.asObservable(), connect: vi.fn() } },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  // ─── WebSocket cleanup ──────────────────────────────────────────────────────

  describe('WebSocket message handling', () => {
    it('processes risk_update messages before ngOnDestroy()', () => {
      let latest: Alert[] = [];
      service.notifications$.subscribe(n => (latest = n));
      const before = latest.length;

      mockMessages$.next({
        type: 'risk_update', patientId: 1, risk: 'red', message: 'Alto riesgo',
      });

      expect(latest.length).toBe(before + 1);
      expect(latest[0].alert_type).toBe('critical');
      expect(mockSnackBar.open).toHaveBeenCalledOnce();
    });

    it('ignores messages emitted after ngOnDestroy()', () => {
      let latest: Alert[] = [];
      service.notifications$.subscribe(n => (latest = n));
      const before = latest.length;

      service.ngOnDestroy();

      mockMessages$.next({
        type: 'risk_update', patientId: 42, risk: 'red', message: 'Should be ignored',
      });

      // Handler did not run — state and snackBar unchanged
      expect(latest.length).toBe(before);
      expect(mockSnackBar.open).not.toHaveBeenCalled();
    });
  });

  // ─── markAsRead ─────────────────────────────────────────────────────────────

  describe('markAsRead()', () => {
    it('marks notification as is_viewed=true on successful PATCH', () => {
      service['notificationsSubject'].next([makeAlert({ id: 77, is_viewed: false })]);
      mockHttp.patch.mockReturnValue(of({ success: true }));

      let result: Alert[] | undefined;
      service.notifications$.subscribe(n => (result = n));

      service.markAsRead(77).subscribe();

      expect(result![0].is_viewed).toBe(true);
    });

    it('still marks notification as is_viewed=true when PATCH fails (optimistic update)', () => {
      service['notificationsSubject'].next([makeAlert({ id: 99, is_viewed: false })]);
      mockHttp.patch.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500 })),
      );

      let result: Alert[] | undefined;
      service.notifications$.subscribe(n => (result = n));

      service.markAsRead(99).subscribe();

      expect(result![0].is_viewed).toBe(true);
    });

    it('decrements unreadCount$ when marking as read', () => {
      service['notificationsSubject'].next([
        makeAlert({ id: 1, is_viewed: false }),
        makeAlert({ id: 2, is_viewed: false }),
      ]);
      service['unreadCountSubject'].next(2);

      let unreadCount: number | undefined;
      service.unreadCount$.subscribe(c => (unreadCount = c));

      service.markAsRead(1).subscribe();

      expect(unreadCount).toBe(1);
    });
  });
});
