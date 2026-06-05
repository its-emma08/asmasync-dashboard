import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-overlay"
         [class.fade-out]="isFadingOut">

      <!-- Ambient particle field -->
      <div class="particle-field">
        <div class="particle" *ngFor="let p of particles" [ngStyle]="p"></div>
      </div>

      <!-- Core animation group -->
      <div class="splash-core">

        <!-- Breathing pulse rings -->
        <div class="pulse-ring ring-1"></div>
        <div class="pulse-ring ring-2"></div>
        <div class="pulse-ring ring-3"></div>

        <!-- SVG lung — anatomical, not heart-shaped -->
        <div class="lung-container">
          <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" class="lung-svg">

            <!-- Trachea (vertical center tube) -->
            <line class="trachea-path" x1="50" y1="8" x2="50" y2="28"
                  stroke="#22d3ee" stroke-width="3" stroke-linecap="round"/>

            <!-- Left bronchus -->
            <path class="trachea-path" d="M 50 28 Q 40 30 36 34"
                  fill="none" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Right bronchus -->
            <path class="trachea-path" d="M 50 28 Q 60 30 64 34"
                  fill="none" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round"/>

            <!-- LEFT LUNG — broad downward lobe -->
            <path class="lung-path"
              d="M 36 34
                 C 30 36 24 40 20 48
                 C 16 56 14 65 16 74
                 C 18 82 24 88 32 90
                 C 38 91 44 88 46 82
                 C 48 76 49 68 49 58
                 L 49 34 Z"
              fill="rgba(6,182,212,0.1)" stroke="#06b6d4" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round"/>

            <!-- Left secondary bronchi -->
            <path class="trachea-path"
              d="M 36 34 C 34 42 32 50 30 58
                 M 36 34 C 32 40 28 48 26 56"
              fill="none" stroke="#06b6d4" stroke-width="1" opacity="0.5"
              stroke-linecap="round"/>

            <!-- RIGHT LUNG — broad downward lobe -->
            <path class="lung-path lung-path-right"
              d="M 64 34
                 C 70 36 76 40 80 48
                 C 84 56 86 65 84 74
                 C 82 82 76 88 68 90
                 C 62 91 56 88 54 82
                 C 52 76 51 68 51 58
                 L 51 34 Z"
              fill="rgba(59,130,246,0.1)" stroke="#3b82f6" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round"/>

            <!-- Right secondary bronchi -->
            <path class="trachea-path"
              d="M 64 34 C 66 42 68 50 70 58
                 M 64 34 C 68 40 72 48 74 56"
              fill="none" stroke="#3b82f6" stroke-width="1" opacity="0.5"
              stroke-linecap="round"/>

            <!-- Carina glow dot -->
            <circle class="center-dot" cx="50" cy="28" r="3.5" fill="#22d3ee"/>
          </svg>
        </div>


        <!-- Wordmark -->
        <div class="wordmark">
          <span class="word-asma">ASMA</span><span class="word-sync">SYNC</span>
          <p class="tagline">Medical Dashboard</p>
        </div>

        <!-- Progress bar -->
        <div class="progress-wrap">
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="progress"></div>
            <div class="progress-glow" [style.left.%]="progress"></div>
          </div>
          <span class="progress-pct">{{ progress }}%</span>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ===== Overlay — Refined for Apple Mesh ===== */
    .splash-overlay {
      position: fixed; inset: 0; z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      background: #030b18;
      overflow: hidden;
      transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s ease;
    }

    /* Ambient Mesh Blobs */
    .splash-overlay::before, .splash-overlay::after {
      content: '';
      position: absolute;
      width: 600px; height: 600px;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.15;
      z-index: 1;
      animation: mesh-float 20s infinite alternate;
    }
    .splash-overlay::before {
      background: #06b6d4;
      top: -10%; left: -10%;
    }
    .splash-overlay::after {
      background: #3b82f6;
      bottom: -10%; right: -10%;
      animation-delay: -10s;
    }

    @keyframes mesh-float {
      0%   { transform: translate(0, 0) scale(1); }
      100% { transform: translate(10%, 10%) scale(1.1); }
    }

    .splash-overlay.fade-out {
      opacity: 0;
      transform: scale(1.08);
      pointer-events: none;
    }

    /* ===== Particle Field (Softer) ===== */
    .particle-field {
      position: absolute; inset: 0; overflow: hidden; pointer-events: none;
      z-index: 2;
    }
    .particle {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 80%);
      animation: float-particle var(--dur, 8s) ease-in-out infinite var(--delay, 0s);
    }

    /* ===== Core group ===== */
    .splash-core {
      position: relative; z-index: 10;
      display: flex; flex-direction: column; align-items: center;
    }

    /* ===== Pulse Rings (More Blur) ===== */
    .pulse-ring {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(6,182,212,0.2);
      filter: blur(4px);
      animation: pulse-expand 4s ease-out infinite;
    }
    .ring-1 { width: 140px; height: 140px; animation-delay: 0s; }
    .ring-2 { width: 220px; height: 220px; animation-delay: 1s; }
    .ring-3 { width: 300px; height: 300px; animation-delay: 2s; }

    @keyframes pulse-expand {
      0%   { transform: scale(0.6); opacity: 0; }
      20%  { opacity: 0.6; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    /* ===== Lung SVG (Pulse Glow) ===== */
    .lung-container {
      position: relative;
      width: 140px; height: 140px;
      display: flex; align-items: center; justify-content: center;
    }
    .lung-svg {
      width:100%; height: 100%;
      filter: drop-shadow(0 0 20px rgba(6,182,212,0.4));
      animation: breathe 4s ease-in-out infinite;
    }
    @keyframes breathe {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(6,182,212,0.3)); }
      50%       { transform: scale(1.08); filter: drop-shadow(0 0 35px rgba(6,182,212,0.7)); }
    }

    /* ===== Wordmark ===== */
    .wordmark {
      margin-top: 24px;
      text-align: center;
      opacity: 0;
      animation: word-in 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards 1s;
    }
    @keyframes word-in {
      from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
      to   { opacity: 1; transform: translateY(0); filter: blur(0); }
    }

    .word-asma {
      font-size: 32px; font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
    }
    .word-sync {
      font-size: 32px; font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    .tagline {
      font-size: 10px;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin-top: 6px;
      font-weight: 600;
    }

    /* ===== Progress Bar (Minimalist) ===== */
    .progress-wrap {
      margin-top: 40px;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      opacity: 0;
      animation: word-in 1s ease forwards 1.5s;
    }
    .progress-track {
      width: 180px; height: 2px;
      background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #06b6d4, #3b82f6);
      transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .progress-pct {
      font-size: 10px; font-weight: 700;
      color: rgba(6,182,212,0.6); letter-spacing: 0.1em;
    }
  `]
})
export class LoadingScreenComponent {
  @Input() progress: number = 0;
  @Input() isFadingOut: boolean = false;

  readonly particles = Array.from({ length: 22 }, (_, i) => {
    const size = 4 + Math.random() * 14;
    return {
      width: `${size}px`,
      height: `${size}px`,
      left: `${Math.random() * 100}%`,
      top: `${60 + Math.random() * 50}%`,
      '--dur': `${5 + Math.random() * 9}s`,
      '--delay': `-${Math.random() * 8}s`,
      opacity: (0.3 + Math.random() * 0.5).toString()
    };
  });
}
