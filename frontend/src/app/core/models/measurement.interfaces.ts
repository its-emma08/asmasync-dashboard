// frontend/src/app/core/models/measurement.interfaces.ts

export interface VitalSigns {
    id?: number;
    patient_id?: number;
    heart_rate: number;
    spo2: number;
    respiratory_rate?: number;
    temperature?: number;
    recorded_at?: string;
}

export interface SpirometerReading {
    id?: number;
    patient_id?: number;
    pef: number;
    fev1: number;
    fvc?: number;
    recorded_at?: string;
}

export interface RenderWeeklyTrend {
    dates: string[];
    pef_values: number[];
    fev1_values: number[];
    spo2_values: number[];
}
