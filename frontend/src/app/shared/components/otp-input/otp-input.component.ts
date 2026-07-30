import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="otp-grid-container mb-8">
      <div class="otp-digit-boxes">
        <input *ngFor="let digit of [0,1,2,3,4,5]; let i = index"
               [id]="'otp-digit-' + i" 
               type="text" 
               maxlength="1" 
               class="otp-box-elite"
               [(ngModel)]="otpDigits()[i]"
               (input)="onInput($event, i)"
               (keydown)="onKeyDown($event, i)"
               autocomplete="one-time-code">
      </div>
    </div>
  `,
  styles: [`
    .otp-digit-boxes {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .otp-box-elite {
      width: 50px;
      height: 64px;
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.1);
      background: rgba(255,255,255,0.6);
      text-align: center;
      font-size: 28px;
      font-weight: 700;
      color: #1d1d1f;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      
      &:focus {
        border-color: #007AFF;
        background: white;
        box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15);
        transform: translateY(-2px);
        outline: none;
      }

      @media (max-width: 480px) {
        width: 42px;
        height: 56px;
        font-size: 24px;
        gap: 8px;
      }
    }
  `]
})
export class OtpInputComponent {
  @Output() codeComplete = new EventEmitter<string>();
  @Output() codeChange = new EventEmitter<string>();

  otpDigits = signal<string[]>(['', '', '', '', '', '']);

  onInput(event: any, index: number): void {
    const val = event.target.value;
    
    // Only allow numbers
    if (!/^[0-9]$/.test(val)) {
      this.otpDigits.update(v => { v[index] = ''; return [...v]; });
      return;
    }

    this.otpDigits.update(v => { v[index] = val; return [...v]; });
    this.codeChange.emit(this.otpDigits().join(''));

    // Auto-focus next
    if (val && index < 5) {
      const next = document.getElementById(`otp-digit-${index + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }

    // Emit if complete
    if (this.otpDigits().every(d => d !== '')) {
      this.codeComplete.emit(this.otpDigits().join(''));
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits()[index] && index > 0) {
      const prev = document.getElementById(`otp-digit-${index - 1}`);
      if (prev) (prev as HTMLInputElement).focus();
    }
  }

  public reset(): void {
    this.otpDigits.set(['', '', '', '', '', '']);
    const first = document.getElementById('otp-digit-0');
    if (first) (first as HTMLInputElement).focus();
  }
}
