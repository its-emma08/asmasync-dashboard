import { Component, Input, Output, EventEmitter, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DashboardWidget } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard-widget.component.html',
  styleUrls: ['./dashboard-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardWidgetComponent {
  @Input() widget!: DashboardWidget;
  @Input() editMode = false;
  @Output() delete = new EventEmitter<string>();
  @Output() resize = new EventEmitter<string>();
  @Output() updateSize = new EventEmitter<{ id: string, colSpan: number, rowSpan?: number }>();

  isResizing = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private containerWidth = 0;

  constructor(private elementRef: ElementRef) { }

  private tempColSpan: number = 0;
  private tempRowSpan: number = 0;

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit(this.widget.id);
  }

  onResize(event: MouseEvent): void {
    event.stopPropagation();
    this.resize.emit(this.widget.id);
  }

  startResize(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isResizing = true;

    this.startX = event.clientX;
    this.startY = event.clientY;

    const element = this.elementRef.nativeElement;
    this.startWidth = element.offsetWidth;
    this.startHeight = element.offsetHeight;

    this.containerWidth = element.parentElement?.offsetWidth || 0;

    this.tempColSpan = this.widget.colSpan;
    this.tempRowSpan = this.widget.rowSpan || 1;

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isResizing || !this.containerWidth) return;

    requestAnimationFrame(() => {
      // Horizontal (ColSpan)
      const deltaX = event.clientX - this.startX;
      const newWidth = this.startWidth + deltaX;
      const colWidth = this.containerWidth / 12; // Assuming 12 grid system or 4? Service says 4. 
      // Wait, Layout says grid-template-columns: repeat(4, 1fr) for desktop. 
      // But dashboard.service says "4 Columns Total".
      // widget-grid in css says "repeat(4, 1fr)".
      // So colWidth = containerWidth / 4. 
      // BUT wait, in previous code I saw `colWidth = this.containerWidth / 12`.
      // If the CSS is 4 cols, then 12 is wrong unless it's a 12-col system spanning 3 for 1 visual col?
      // Let's look at `dashboard-home.component.scss` (step 13503): `grid-template-columns: repeat(4, 1fr);`
      // So it IS 4 columns.
      // My previous code had `containerWidth / 12`. This creates finer granularity? 
      // No, `newColSpan = Math.round(newWidth / colWidth)`.
      // If I divide by 12, I get 12 columns.
      // But `max(3, min(12, ...))` suggests the widget thinks in 12 cols.
      // Let's check `DashboardWidget` interface. `colSpan: number; // 1 to 12`.
      // BUT `dashboard.service.ts` says:
      // `// Grid System: 4 Columns Total`
      // `// 4 = Full Width (100%)`
      // And `updateWidgetColSpan` clamps to 4: `Math.max(1, Math.min(4, colSpan))`.
      // So the TS logic `containerWidth / 12` and `max(12)` was WRONG/Legacy in my previous edit?
      // Wait, let's re-read `dashboard-widget.component.ts` step 13481.
      // `const colWidth = this.containerWidth / 12;`
      // `newColSpan = Math.max(3, Math.min(12, newColSpan));`
      // PROBABLY this was wrong if the grid is 4 columns.
      // OR the user wants 12 columns?
      // The service clearly says 4 columns.
      // I should fix this to 4.

      const gridCols = 4;
      const colUnit = this.containerWidth / gridCols;
      let newColSpan = Math.round(newWidth / colUnit);
      newColSpan = Math.max(1, Math.min(gridCols, newColSpan));

      // Vertical (RowSpan)
      // Row Height = 160px + 24px gap = 184px
      const rowUnit = 184;
      const deltaY = event.clientY - this.startY;
      const newHeight = this.startHeight + deltaY;
      let newRowSpan = Math.round((newHeight + 24) / rowUnit);
      newRowSpan = Math.max(1, newRowSpan);

      let changed = false;

      if (newColSpan !== this.tempColSpan) {
        this.tempColSpan = newColSpan;
        this.elementRef.nativeElement.style.gridColumn = `span ${newColSpan}`;
        changed = true;
      }

      if (newRowSpan !== this.tempRowSpan) {
        this.tempRowSpan = newRowSpan;
        this.elementRef.nativeElement.style.gridRow = `span ${newRowSpan}`;
        changed = true;
      }
    });
  }

  private onMouseUp = (): void => {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);

    if (this.tempColSpan !== this.widget.colSpan || this.tempRowSpan !== (this.widget.rowSpan || 1)) {
      this.updateSize.emit({
        id: this.widget.id,
        colSpan: this.tempColSpan,
        rowSpan: this.tempRowSpan
      });
    }
  }
}
