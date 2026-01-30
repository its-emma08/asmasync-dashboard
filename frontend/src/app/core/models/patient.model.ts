export interface Patient {
    id: number;
    fullName: string;
    age: number;
    gender: 'M' | 'F';
    riskLevel: 'green' | 'yellow' | 'red';
    currentPEF: number; // Flujo Espiratorio Máximo en L/min
    personalBestPEF: number;
    currentSpO2: number; // Saturación O2 en %
    respiratoryRate: number;
    lastUpdate: Date;
    lastCrisis: Date | null;
    profilePicture?: string;
}

export interface PEFTrend {
    date: Date;
    pefValue: number;
    zone: 'green' | 'yellow' | 'red';
}
