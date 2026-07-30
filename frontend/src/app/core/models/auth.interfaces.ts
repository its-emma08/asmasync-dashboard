// frontend/src/app/core/models/auth.interfaces.ts
import { RiskLevel } from './patient.model';

export interface RenderUser {
    id: number;
    email: string;
    full_name: string;
    role: 'doctor' | 'admin' | 'patient';
    specialty?: string;
    is_active: boolean;
    created_at: string;
}

export interface RenderProfile {
    user: RenderUser;
    stats?: RenderStats;
}

export interface RenderStats {
    total: number;
    critical: number;
    moderate: number;
    stable: number;
}

export interface GoogleVerifyResponse {
    access_token: string;
    user: RenderUser;
}
