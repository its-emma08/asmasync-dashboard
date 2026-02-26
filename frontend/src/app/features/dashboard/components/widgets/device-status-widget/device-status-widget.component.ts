import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-device-status-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatRippleModule, MatTooltipModule],
  templateUrl: './device-status-widget.component.html',
  styleUrls: ['./device-status-widget.component.scss']
})
export class DeviceStatusWidgetComponent { }
