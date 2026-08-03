import {
  Component, Input, Output, EventEmitter, HostBinding,
  OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';

export type WidgetSize = 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'full' | 'full-large';

export const WIDGET_SIZE_MAP: Record<string, WidgetSize> = {
  'kpi-group': 'full',
  'alerts-panel': 'large',
  'patients-table': 'full-large',
  'trend-chart': 'large',
  'activity-list': 'large',
  'weather': 'small',
  'calendar': 'large',
  'quick-actions': 'medium',
  'medication': 'small',
  'device-status': 'small',
  'act-score': 'small',
  'single-kpi': 'small',
  'birthdays': 'small',
  'reminders': 'small',
  'shortcuts': 'small',
  'default': 'medium'
};

const SIZE_LABELS_ES: Record<WidgetSize, string> = {
  small: 'Pequeño',
  medium: 'Mediano',
  wide: 'Ancho',
  large: 'Grande',
  tall: 'Alto',
  full: 'Completo',
  'full-large': 'Completo Grande'
};

// Cycle order for resize (One UI 8.5 style)
const SIZE_CYCLE: WidgetSize[] = ['small', 'medium', 'large', 'wide', 'tall', 'full', 'full-large'];

@Component({
  selector: 'app-widget-shell',
  standalone: true,
  imports: [CommonModule, MatIconModule, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="shell-inner"
      [class.dragging]="isDragging"
    >
      <!-- Edit mode controls -->
      <ng-container *ngIf="editMode">
        <!-- Delete -->
        <button class="ctrl-btn ctrl-delete" (click)="onDelete($event)" aria-label="Eliminar widget">
          <span class="ctrl-icon">−</span>
        </button>

        <!-- Size Controls (One UI 8.5 style) -->
        <div class="size-controls">
          <button class="size-btn size-btn--shrink" (click)="shrinkSize($event)"
            [disabled]="isMinSize" aria-label="Reducir tamaño">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M2 5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <span class="size-label">{{ sizeNameEs }}</span>
          <button class="size-btn size-btn--grow" (click)="growSize($event)"
            [disabled]="isMaxSize" aria-label="Ampliar tamaño">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M5 2v6M2 5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Drag handle -->
        <div class="drag-handle" cdkDragHandle aria-label="Mover widget">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="5" cy="4" r="1.5" fill="currentColor" opacity="0.6"/>
            <circle cx="5" cy="8" r="1.5" fill="currentColor" opacity="0.6"/>
            <circle cx="5" cy="12" r="1.5" fill="currentColor" opacity="0.6"/>
            <circle cx="11" cy="4" r="1.5" fill="currentColor" opacity="0.6"/>
            <circle cx="11" cy="8" r="1.5" fill="currentColor" opacity="0.6"/>
            <circle cx="11" cy="12" r="1.5" fill="currentColor" opacity="0.6"/>
          </svg>
        </div>

        <!-- Edit overlay shimmer -->
        <div class="edit-overlay"></div>
      </ng-container>

      <!-- Widget content -->
      <div class="widget-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      height: 100%;
      /* Size mapping via host binding classes */
    }

    /* ── Size Host Bindings ── */
    :host.size-small  { grid-column: span 1; grid-row: span 1; min-height: 160px; }
    :host.size-medium { grid-column: span 2; grid-row: span 1; min-height: 160px; }
    :host.size-wide   { grid-column: span 3; grid-row: span 1; min-height: 160px; }
    :host.size-large  { grid-column: span 2; grid-row: span 2; min-height: 340px; }
    :host.size-tall   { grid-column: span 1; grid-row: span 2; min-height: 340px; }
    :host.size-full   { grid-column: span 4; grid-row: span 1; min-height: 160px; }
    :host.size-full-large { grid-column: span 4; grid-row: span 2; min-height: 340px; }

    /* ── Edit mode highlight ── */
    :host.edit-mode .shell-inner {
      outline: 2px dashed rgba(0, 122, 255, 0.4);
      outline-offset: 2px;
    }

    /* ── Shell inner ── */
    .shell-inner {
      position: relative;
      height: 100%;
      width: 100%;
      border-radius: 20px;
      transition: box-shadow 0.25s ease, transform 0.25s ease;
      background: #ffffff;
      border: 1px solid rgba(0, 20, 60, 0.07);
      box-shadow:
        0 2px 8px rgba(0, 20, 60, 0.05),
        0 1px 2px rgba(0, 20, 60, 0.04);
      cursor: default;

      /* Top edge highlight — premium elevation effect */
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.9);
        pointer-events: none;
        z-index: 1;
      }
    }

    :host-context(.dark) .shell-inner,
    .dark .shell-inner {
      background: rgba(15, 23, 42, 0.85) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4) !important;

      &::before {
        border-top-color: rgba(255, 255, 255, 0.12) !important;
      }
    }


    .shell-inner:hover {
      box-shadow:
        0 8px 24px rgba(0, 20, 60, 0.08),
        0 3px 6px rgba(0, 20, 60, 0.05);
    }

    .shell-inner.dragging {
      opacity: 0.85 !important;
      box-shadow: 0 24px 48px rgba(0, 20, 60, 0.15) !important;
      cursor: grabbing !important;
      transform: scale(1.02);
    }

    /* ── Widget content fills shell ── */
    .widget-content {
      height: 100%;
      width: 100%;
      overflow: hidden;
      border-radius: 20px;
      position: relative;
      z-index: 2;
    }

    /* ── Drag placeholder ── */
    .drag-placeholder {
      width: 100%;
      height: 100%;
      background: rgba(0, 122, 255, 0.08) !important;
      border: 2px dashed rgba(0, 122, 255, 0.35) !important;
      border-radius: 20px !important;
    }

    /* ── Edit overlay ── */
    .edit-overlay {
      position: absolute;
      inset: 0;
      border-radius: 20px;
      pointer-events: none;
      background: rgba(0, 122, 255, 0.03);
      z-index: 3;
    }

    /* ── Control Buttons ── */
    .ctrl-btn {
      position: absolute;
      z-index: 10;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s ease, opacity 0.15s ease;
      -webkit-app-region: no-drag;
    }

    .ctrl-btn:hover { transform: scale(1.1); }
    .ctrl-btn:active { transform: scale(0.95); }

    /* Delete — top-left red dot */
    .ctrl-delete {
      top: -10px;
      left: -10px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #ff3b30;
      box-shadow: 0 2px 8px rgba(255,59,48,0.45);
    }

    .ctrl-delete .ctrl-icon {
      color: white;
      font-size: 18px;
      line-height: 1;
      font-weight: 700;
      margin-top: -2px;
    }

    /* ── Size Controls (One UI 8.5 style pill) ── */
    .size-controls {
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 0;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 20px;
      padding: 3px 6px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      white-space: nowrap;
    }

    .size-btn {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #007AFF;
      transition: background 0.15s ease;
      flex-shrink: 0;
    }

    .size-btn:hover:not(:disabled) {
      background: rgba(0, 122, 255, 0.1);
    }

    .size-btn:disabled {
      opacity: 0.3;
      cursor: default;
    }

    .size-label {
      font-size: 10px;
      font-weight: 700;
      color: #1c1c1e;
      padding: 0 5px;
      min-width: 52px;
      text-align: center;
      letter-spacing: -0.01em;
    }

    /* Drag handle — bottom center */
    .drag-handle {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      width: 32px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      color: rgba(0,0,0,0.35);
      background: rgba(255,255,255,0.7);
      border-radius: 8px;
      backdrop-filter: blur(4px);
      transition: background 0.15s ease, color 0.15s ease;
    }

    .drag-handle:hover {
      background: rgba(255,255,255,1);
      color: rgba(0,0,0,0.6);
    }

    .drag-handle:active { cursor: grabbing; }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .drag-handle {
        color: rgba(255,255,255,0.5);
        background: rgba(30,41,59,0.7);
      }
      .drag-handle:hover {
        background: rgba(30,41,59,0.95);
        color: white;
      }
      .size-controls {
        background: rgba(30, 41, 59, 0.95);
        border-color: rgba(255,255,255,0.1);
      }
      .size-label { color: #ffffff; }
    }
  `]
})
export class WidgetShellComponent implements OnInit, OnDestroy {
  @Input() editMode = false;
  @Input() currentSize: WidgetSize = 'medium';
  @Input() widgetType: string = 'default';
  @Output() deleted = new EventEmitter<void>();
  @Output() sizeChanged = new EventEmitter<WidgetSize>();

  isDragging = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Only apply default fallback size if currentSize is missing
    if (this.widgetType && !this.currentSize) {
      this.currentSize = WIDGET_SIZE_MAP[this.widgetType] || WIDGET_SIZE_MAP['default'];
    }
  }

  @HostBinding('class')
  get hostClasses(): string {
    const classes = [`size-${this.currentSize}`];
    if (this.editMode) classes.push('edit-mode');
    return classes.join(' ');
  }

  get sizeNameEs(): string {
    return SIZE_LABELS_ES[this.currentSize] ?? this.currentSize;
  }

  get sizeLabel(): string {
    const labels: Record<WidgetSize, string> = {
      small: 'S',
      medium: 'M',
      wide: 'W',
      large: 'L',
      tall: 'T',
      full: 'F',
      'full-large': 'FL'
    };
    return labels[this.currentSize];
  }

  get currentSizeIndex(): number {
    return SIZE_CYCLE.indexOf(this.currentSize);
  }

  get isMinSize(): boolean {
    return this.currentSizeIndex <= 0;
  }

  get isMaxSize(): boolean {
    return this.currentSizeIndex >= SIZE_CYCLE.length - 1;
  }

  growSize(event: MouseEvent): void {
    event.stopPropagation();
    const idx = this.currentSizeIndex;
    if (idx < SIZE_CYCLE.length - 1) {
      this.currentSize = SIZE_CYCLE[idx + 1];
      this.sizeChanged.emit(this.currentSize);
      this.cdr.markForCheck();
    }
  }

  shrinkSize(event: MouseEvent): void {
    event.stopPropagation();
    const idx = this.currentSizeIndex;
    if (idx > 0) {
      this.currentSize = SIZE_CYCLE[idx - 1];
      this.sizeChanged.emit(this.currentSize);
      this.cdr.markForCheck();
    }
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.deleted.emit();
  }

  onDragStart(): void {
    this.isDragging = true;
    this.cdr.markForCheck();
  }

  onDragEnd(): void {
    this.isDragging = false;
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {}
}
