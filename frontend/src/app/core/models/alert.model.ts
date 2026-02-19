export interface Alert {
    id: number;
    patient_id: number;
    alert_type: 'critical' | 'moderate' | 'info';
    message: string;
    is_viewed: boolean;
    created_at: string;
    patient?: {
        id: number;
        full_name: string;
        risk_level: string;
    };
}
