export interface Alert {
    id: number;
    patientId: number;
    patientName: string;
    type: 'critical' | 'moderate';
    message: string;
    timestamp: Date;
    isRead: boolean;
    severity: 'high' | 'medium';
}
