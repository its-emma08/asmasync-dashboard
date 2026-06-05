export interface Intervention {
    id?: number;
    doctor_id?: number;
    patient_id: number;
    type: InterventionType;
    description: string;
    recommendations?: string;
    next_follow_up?: string | null;
    doctor_name?: string;
    patient_name?: string;
    created_at?: string;
    updated_at?: string;
}

export type InterventionType =
    | 'counseling'
    | 'education'
    | 'plan_adjustment'
    | 'phone_counseling'
    | 'action_plan_adjustment'
    | 'educational_reinforcement'
    | 'inhaler_technique_review'
    | 'other';

export const INTERVENTION_TYPE_LABELS: Record<InterventionType, string> = {
    counseling: 'Consejería',
    education: 'Educación',
    plan_adjustment: 'Ajuste de plan',
    phone_counseling: 'Consejería telefónica',
    action_plan_adjustment: 'Ajuste de plan de acción',
    educational_reinforcement: 'Refuerzo educativo',
    inhaler_technique_review: 'Revisión técnica de inhalador',
    other: 'Otro',
};
