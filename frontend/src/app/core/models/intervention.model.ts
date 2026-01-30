export interface Intervention {
    id?: number;
    patientId: number;
    nurseId: number;
    nurseName: string; // Nombre de enfermera/o
    type: 'counseling' | 'plan-adjustment' | 'education' | 'other';
    description: string;
    recommendations: string;
    nextFollowUp: Date;
    createdAt: Date;
}
