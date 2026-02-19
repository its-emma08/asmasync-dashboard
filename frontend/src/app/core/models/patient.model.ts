export interface Patient {
    id: string | number;
    firebase_uid?: string; // SQL alignment
    full_name: string; // SQL alignment
    // age: number; // REMOVED
    date_of_birth: string; // SQL alignment (ISO Date)
    gender: 'male' | 'female' | 'other'; // SQL alignment
    asthma_type: 'allergic' | 'non_allergic' | 'mixed' | 'exercise_induced'; // SQL alignment
    height_cm?: number;
    weight_kg?: number;
    diagnosisDate?: string; // YYYY-MM-DD


    riskLevel: 'green' | 'yellow' | 'red';
    latest_pef: number; // SQL alignment (was currentPEF)
    personal_best_pef: number;
    currentSpO2: number;
    respiratoryRate: number;
    lastUpdate: Date | string;
    lastCrisis: Date | null;
    profilePicture?: string; // avatar_seed generator
    adherence?: number;
    status?: 'Crítico' | 'Moderado' | 'Estable';
    email?: string;
    phone?: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relation: string;
    };

    // Legacy support for UI until fully refactored
    background?: {
        diagnosis: string;
        allergies: string[];
        hereditary: string[];
        smoking: boolean;
    };
    contact?: {
        name: string;
        relation: string;
        phone: string;
    };
    medications?: {
        name: string;
        dosage: string;
        frequency: string;
    }[];
    history?: any[];
    pefTrend?: PEFTrend[];
    interventions?: {
        date: Date | string;
        type: string;
        description: string;
        doctor: string;
    }[];
    documents?: {
        name: string;
        date: string;
        type: 'pdf' | 'img' | 'doc';
        url: string;
    }[];
    clinical_history?: ClinicalHistory;
}

export interface PEFTrend {
    date: Date | string;
    pefValue: number;
    zone: 'green' | 'yellow' | 'red';
}

export interface ClinicalHistory {
    identification: {
        civil_status: string;
        religion: string;
        education: string;
        occupation: string;
        birth_place: string;
        blood_type: string;
    };
    family_history: {
        mother?: string;
        father?: string;
        siblings?: string;
        grandparents?: string;
    };
    non_pathological: {
        housing_type: string; // Urbana/Rural
        services: string[]; // Agua, Luz, Drenaje
        hygiene: {
            bath_freq: string;
            dental_freq: string;
        };
        diet: string; // Buena/Regular/Mala
        zoonosis: string; // Mascotas
        physical_activity: string;
    };
    pathological: {
        smoking: string; // Si/No/Ex
        alcoholism: string;
        allergies: string;
        surgeries: string;
        trauma: string;
        hospitalizations: string;
    };
    gynecological?: { // Optional for male
        menarche?: string;
        fum?: string; // Last period
        ivsa?: string; // Sexual start
        pap_smear?: string;
    };
}
