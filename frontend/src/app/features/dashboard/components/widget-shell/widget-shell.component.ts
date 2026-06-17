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
      transition: outline 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
      background: var(--bg-card);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      box-shadow: var(--shadow-sm);
      cursor: default;
    }

    .shell-inner:hover {
      box-shadow: var(--shadow-md);
    }

    .shell-inner.dragging {
      opacity: 0.8 !important;
      box-shadow: 0 24px 48px rgba(0,0,0,0.2) !important;
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
    // Override the size to a fixed size according to the widget type
    if (this.widgetType) {
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
