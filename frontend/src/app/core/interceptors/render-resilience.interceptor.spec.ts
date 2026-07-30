import {
  HttpContext,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { TimeoutError } from 'rxjs';
import { SKIP_RESILIENCE } from './http-context.tokens';
import { RenderResilienceInterceptor } from './render-resilience.interceptor';
import { ToastService } from '../services/toast.service';

function makeRequest(skipResilience = false): HttpRequest<unknown> {
  const ctx = new HttpContext();
  if (skipResilience) ctx.set(SKIP_RESILIENCE, true);
  return new HttpRequest('GET', '/api/test', { context: ctx });
}

function makeErrorResponse(status: number): HttpErrorResponse {
  return new HttpErrorResponse({ status, url: '/api/test' });
}

describe('RenderResilienceInterceptor', () => {
  let interceptor: RenderResilienceInterceptor;
  let mockToast: ToastService;

  beforeEach(() => {
    mockToast = {
      showError: vi.fn(),
      showInfo: vi.fn(),
      showSuccess: vi.fn(),
      showWarning: vi.fn(),
    } as unknown as ToastService;
    interceptor = new RenderResilienceInterceptor(mockToast);
  });

  // ─── SKIP_RESILIENCE ──────────────────────────────────────────────────────

  describe('SKIP_RESILIENCE token', () => {
    it('bypasses the resilience pipe and forwards the request unchanged', () => {
      const req = makeRequest(true);
      const success = new HttpResponse({ status: 200 });
      const handler = {
        handle: vi.fn().mockReturnValue(new Observable(s => { s.next(success); s.complete(); })),
      } as unknown as HttpHandler;

      let result: HttpEvent<unknown> | undefined;
      interceptor.intercept(req, handler).subscribe(r => (result = r));

      expect(handler.handle).toHaveBeenCalledWith(req);
      expect(result).toBe(success);
      expect(mockToast.showError).not.toHaveBeenCalled();
      expect(mockToast.showInfo).not.toHaveBeenCalled();
    });
  });

  // ─── NON-RETRYABLE ERRORS ─────────────────────────────────────────────────

  describe('non-retryable errors', () => {
    it('passes a 400 through without retry and without showing a toast', () => {
      const err400 = makeErrorResponse(400);
      const handler = {
        handle: vi.fn().mockReturnValue(throwError(() => err400)),
      } as unknown as HttpHandler;

      let caughtError: unknown;
      interceptor
        .intercept(makeRequest(), handler)
        .subscribe({ error: e => (caughtError = e) });

      // handle() should be called once — no retry
      expect(handler.handle).toHaveBeenCalledTimes(1);
      expect(caughtError).toBe(err400);
      expect(mockToast.showError).not.toHaveBeenCalled();
      expect(mockToast.showInfo).not.toHaveBeenCalled();
    });

    it('passes a 404 through without retry and without showing a toast', () => {
      const err404 = makeErrorResponse(404);
      const handler = {
        handle: vi.fn().mockReturnValue(throwError(() => err404)),
      } as unknown as HttpHandler;

      let caughtError: unknown;
      interceptor
        .intercept(makeRequest(), handler)
        .subscribe({ error: e => (caughtError = e) });

      expect(handler.handle).toHaveBeenCalledTimes(1);
      expect(caughtError).toBe(err404);
      expect(mockToast.showError).not.toHaveBeenCalled();
    });
  });

  // ─── TIMEOUT AND RETRY ───────────────────────────────────────────────────
  //
  // attempt$ = next.handle(req).pipe(timeout(10_000))
  // retry resubscribes to attempt$, which resubscribes to the underlying source.
  // We use a Subject as source so we can control emissions per-subscription.

  describe('timeout and retry behavior (fake timers)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('retries once on timeout and succeeds on the second attempt', async () => {
      // A Subject that never emits on its own — timeout fires after 10s.
      // After the retry resubscribes, we emit manually to simulate a recovered server.
      const source = new Subject<HttpEvent<unknown>>();
      const handler = {
        handle: vi.fn().mockReturnValue(source.asObservable()),
      } as unknown as HttpHandler;

      let result: HttpEvent<unknown> | undefined;
      let error: unknown;
      interceptor
        .intercept(makeRequest(), handler)
        .subscribe({ next: r => (result = r), error: e => (error = e) });

      // Attempt 1 times out
      await vi.advanceTimersByTimeAsync(10_001);
      // Retry delay: 500 * 2^(1-1) = 500ms
      await vi.advanceTimersByTimeAsync(500);
      // retry has resubscribed — emit success on the same Subject
      const success = new HttpResponse({ status: 200 });
      source.next(success);
      source.complete();

      expect(result).toBe(success);
      expect(error).toBeUndefined();
      expect(mockToast.showError).not.toHaveBeenCalled();
    });

    it('shows showError toast after exhausting all retries on repeated timeouts', async () => {
      const source = new Subject<HttpEvent<unknown>>();
      const handler = {
        handle: vi.fn().mockReturnValue(source.asObservable()),
      } as unknown as HttpHandler;

      let error: unknown;
      interceptor
        .intercept(makeRequest(), handler)
        .subscribe({ error: e => (error = e) });

      // Attempt 1 timeout
      await vi.advanceTimersByTimeAsync(10_001);
      // Retry delay 1: 500ms
      await vi.advanceTimersByTimeAsync(500);
      // Attempt 2 timeout
      await vi.advanceTimersByTimeAsync(10_001);
      // Retry delay 2: 1 000ms
      await vi.advanceTimersByTimeAsync(1_000);
      // Attempt 3 timeout → catchError
      await vi.advanceTimersByTimeAsync(10_001);

      expect(error).toBeInstanceOf(TimeoutError);
      expect(mockToast.showError).toHaveBeenCalledOnce();
      expect(mockToast.showError).toHaveBeenCalledWith(
        expect.stringContaining('tardó demasiado'),
      );
    });

    it('shows showInfo toast on 502 during retry and succeeds on second subscription', async () => {
      let subscriptionCount = 0;
      // Cold Observable: errors on sub 1, succeeds on sub 2
      const source = new Observable<HttpEvent<unknown>>(subscriber => {
        subscriptionCount++;
        if (subscriptionCount === 1) {
          subscriber.error(makeErrorResponse(502));
        } else {
          subscriber.next(new HttpResponse({ status: 200 }));
          subscriber.complete();
        }
      });
      const handler = {
        handle: vi.fn().mockReturnValue(source),
      } as unknown as HttpHandler;

      let result: HttpEvent<unknown> | undefined;
      interceptor
        .intercept(makeRequest(), handler)
        .subscribe({ next: r => (result = r) });

      // 502 is immediate — info toast shown, retry delay starts (500ms)
      await vi.advanceTimersByTimeAsync(500);

      expect(mockToast.showInfo).toHaveBeenCalledWith(
        expect.stringContaining('Conexión inestable'),
      );
      expect(result).toBeInstanceOf(HttpResponse);
      expect(mockToast.showError).not.toHaveBeenCalled();
    });

    it('shows showInfo toast on 504 during retry and succeeds on second subscription', async () => {
      let subscriptionCount = 0;
      const source = new Observable<HttpEvent<unknown>>(subscriber => {
        subscriptionCount++;
        if (subscriptionCount === 1) {
          subscriber.error(makeErrorResponse(504));
        } else {
          subscriber.next(new HttpResponse({ status: 200 }));
          subscriber.complete();
        }
      });
      const handler = {
        handle: vi.fn().mockReturnValue(source),
      } as unknown as HttpHandler;

      let result: HttpEvent<unknown> | undefined;
      interceptor
        .intercept(makeRequest(), handler)
        .subscribe({ next: r => (result = r) });

      await vi.advanceTimersByTimeAsync(500);

      expect(mockToast.showInfo).toHaveBeenCalledWith(
        expect.stringContaining('despertando'),
      );
      expect(result).toBeInstanceOf(HttpResponse);
    });

    it('shows showError toast with network message on status 0', async () => {
      // status 0 is retryable but exhausts retries — use 3 failures
      let subscriptionCount = 0;
      const source = new Observable<HttpEvent<unknown>>(subscriber => {
        subscriptionCount++;
        subscriber.error(makeErrorResponse(0));
      });
      const handler = {
        handle: vi.fn().mockReturnValue(source),
      } as unknown as HttpHandler;

      let error: unknown;
      interceptor
        .intercept(makeRequest(), handler)
        .subscribe({ error: e => (error = e) });

      // Retry delay 1: 500ms
      await vi.advanceTimersByTimeAsync(500);
      // Retry delay 2: 1 000ms
      await vi.advanceTimersByTimeAsync(1_000);

      expect(subscriptionCount).toBe(3);
      expect(mockToast.showError).toHaveBeenCalledWith(
        expect.stringContaining('conexión'),
      );
    });
  });
});
