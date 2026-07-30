/**
 * API Generated Models (Based on Asthma Predictor API)
 * Generated at: 2026-03-17
 */

export interface UserResponse {
    id: number;
    supabase_uid: string;
    email: string;
    full_name: string;
    role: string;
    doctor_code?: string | null;
    avatar_seed: string;
    avatar_background: string;
    is_active: boolean;
    is_setup_completed?: boolean;
    created_at: string;
}

export interface AuthResponse {
    message: string;
    user: UserResponse;
}

export interface VitalSignResponse {
    id: number;
    user_id: number;
    spo2?: number | null;
    heart_rate?: number | null;
    sleep_hours?: number | null;
    measured_at: string;
    created_at: string;
}

export interface SpirometerResponse {
    id: number;
    user_id: number;
    pef: number;
    fev1?: number | null;
    symptoms?: string | null;
    symptom_intensity?: string | null;
    notes?: string | null;
    aqi?: number | null;
    temperature?: number | null;
    humidity?: number | null;
    pollen_level?: string | null;
    location_name?: string | null;
    measured_at: string;
    created_at: string;
}

export interface WeeklyTrendPoint {
    date: string;
    value: number;
    source: string;
}

export interface WeeklyTrendResponse {
    max_pef: number | null;
    min_pef: number | null;
    avg_pef: number | null;
    daily_data: WeeklyTrendPoint[];
}

export interface PredictionResponse {
    id: number;
    user_id: number;
    risk_level: string;
    probability: number;
    input_data: any;
    predicted_at: string;
    model_version?: string | null;
}

export interface DashboardStats {
    total: number;
    critical: number;
    moderate: number;
    stable: number;
}
