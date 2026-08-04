import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-auth-shell',
    standalone: true,
    imports: [RouterOutlet],
    template: `
    <div class="auth-shell">
        <!-- Ambient blurred orbs — Clinical Clean -->
        <div class="orb orb--blue"></div>
        <div class="orb orb--cyan"></div>
        <div class="orb orb--teal"></div>
        <div class="orb orb--glow"></div>

        <div class="auth-shell__content">
            <router-outlet></router-outlet>
        </div>
    </div>
    `,
    styles: [`
        :host {
            display: block;
            min-height: 100vh;
        }

        .auth-shell {
            position: relative;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            overflow: hidden;
            background: var(--auth-bg, linear-gradient(145deg, #f0f4ff 0%, #eef6ff 55%, #f5f5f7 100%));
            transition: background 0.4s ease;
        }

        /* Ambient orbs */
        .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(64px);
            pointer-events: none;
            opacity: 0.55;
        }

        .orb--blue {
            top: -8%;
            left: -6%;
            width: 520px;
            height: 520px;
            background: radial-gradient(circle, rgba(26, 111, 232, 0.16) 0%, transparent 70%);
            animation: orbFloat 12s ease-in-out infinite;
        }

        .orb--cyan {
            top: 28%;
            right: -10%;
            width: 620px;
            height: 620px;
            background: radial-gradient(circle, rgba(14, 165, 201, 0.14) 0%, transparent 70%);
            animation: orbFloat 16s ease-in-out infinite reverse;
        }

        .orb--teal {
            bottom: -12%;
            left: 22%;
            width: 520px;
            height: 520px;
            background: radial-gradient(circle, rgba(13, 162, 190, 0.12) 0%, transparent 70%);
            animation: orbFloat 14s ease-in-out infinite;
        }

        .orb--glow {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 900px;
            height: 900px;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, transparent 65%);
            opacity: 0.6;
            animation: orbPulse 10s ease-in-out infinite;
        }

        /* Content layer above orbs */
        .auth-shell__content {
            position: relative;
            z-index: 2;
            width: 100%;
            display: flex;
            justify-content: center;
        }

        :host-context(body.dark) .auth-shell {
            background: var(--auth-bg-dark, linear-gradient(180deg, #0b1220 0%, #0d1b2a 60%, #0f172a 100%));
        }

        :host-context(body.dark) .orb--blue {
            background: radial-gradient(circle, rgba(26, 111, 232, 0.22) 0%, transparent 70%);
        }
        :host-context(body.dark) .orb--cyan {
            background: radial-gradient(circle, rgba(14, 165, 201, 0.18) 0%, transparent 70%);
        }
        :host-context(body.dark) .orb--teal {
            background: radial-gradient(circle, rgba(13, 162, 190, 0.16) 0%, transparent 70%);
        }
        :host-context(body.dark) .orb--glow {
            background: radial-gradient(circle, rgba(30, 41, 59, 0.5) 0%, transparent 65%);
        }

        @keyframes orbFloat {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(24px, -20px) scale(1.05); }
        }

        @keyframes orbPulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.75; }
        }
    `]
})
export class AuthShellComponent {}