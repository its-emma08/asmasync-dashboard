export interface HistoryRecord {
    date: string;
    pef: number;
    status: 'Crítico' | 'Moderado' | 'Estable';
}

export interface PatientMock {
    id: string;
    name: string;
    age: number;
    gender: 'Masculino' | 'Femenino';
    email: string;
    phone: string;
    avatar: string;
    currentPEF: number;
    previousPEF: number;
    personalBestPEF: number;
    status: 'Crítico' | 'Moderado' | 'Estable';
    riskLevel: 'red' | 'yellow' | 'green';
    adherence: number;
    lastUpdate: string;
    history: HistoryRecord[];
    background: {
        diagnosis: string;
        allergies: string[];
        hereditary: string[];
        smoking: boolean;
    };
    contact: {
        name: string;
        relation: string;
        phone: string;
    };
    medications: {
        name: string;
        dosage: string;
        frequency: string;
    }[];
}

const getDob = (age: number): string => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - age);
    date.setMonth(Math.floor(Math.random() * 12));
    date.setDate(Math.floor(Math.random() * 28) + 1);
    return date.toISOString().split('T')[0];
};

const avatarUrl = (name: string): string =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true&size=128`;

export const MOCK_PATIENTS: any[] = [
    {
        id: 'P-00123',
        firebase_uid: 'uid_123',
        full_name: 'Emmanuel Peña Ruiz',
        date_of_birth: getDob(32),
        gender: 'male',
        asthma_type: 'allergic',
        height_cm: 175,
        weight_kg: 80,
        email: 'emmanuel.pena@example.com',
        phone: '555-0101',
        profilePicture: avatarUrl('Emmanuel Peña Ruiz'),
        latest_pef: 320,
        personalBestPEF: 450,
        status: 'Crítico',
        riskLevel: 'red',
        adherence: 60,
        lastUpdate: 'Hace 10 min',
        currentSpO2: 92,
        respiratoryRate: 22,
        history: [
            { date: '2024-02-10', pef: 320, status: 'Crítico' },
            { date: '2024-02-09', pef: 340, status: 'Moderado' }
        ],
        clinical_history: {
            identification: {
                civil_status: 'Casado',
                religion: 'Católica',
                education: 'Licenciatura',
                occupation: 'Ingeniero de Software',
                birth_place: 'Ciudad de México',
                blood_type: 'O+'
            },
            family_history: {
                mother: 'Hipertensión Arterial, Asma',
                father: 'Diabetes Mellitus Tipo 2',
                siblings: 'Ninguno',
                grandparents: 'Abuela materna con cáncer de mama'
            },
            non_pathological: {
                housing_type: 'Urbana',
                services: ['Agua potable', 'Electricidad', 'Drenaje', 'Gas'],
                hygiene: {
                    bath_freq: 'Diario',
                    dental_freq: '2 veces al día'
                },
                diet: 'Balanceada, alta en fibra',
                zoonosis: '1 Perro (dentro de casa)',
                physical_activity: 'Caminata 30 min/día'
            },
            pathological: {
                smoking: 'Negado',
                alcoholism: 'Ocasional (social)',
                allergies: 'Polen, Ácaros',
                surgeries: 'Apendicectomía (2015)',
                trauma: 'Fractura de radio distal (2010)',
                hospitalizations: 'Ninguna reciente'
            },
            gynecological: {
                menarche: 'N/A', fum: 'N/A', ivsa: 'N/A', pap_smear: 'N/A'
            }
        },
        background: {
            diagnosis: 'Asma Persistente Severa',
            allergies: ['Polen', 'Polvo', 'Ácaros'],
            hereditary: ['Madre asmática'],
            smoking: false
        },
        contact: {
            name: 'María Pérez',
            relation: 'Esposa',
            phone: '555-0102'
        },
        medications: [
            { name: 'Salbutamol', dosage: '100mcg', frequency: 'Cada 4h si es necesario' }
        ],
        documents: [
            { name: 'Espirometría_2024.pdf', date: '2024-01-15', type: 'pdf', url: '#' },
            { name: 'Radiografía_Torax.jpg', date: '2023-11-20', type: 'img', url: '#' }
        ]
    },
    {
        id: 'P-00124',
        firebase_uid: 'uid_124',
        full_name: 'Ana García López',
        date_of_birth: getDob(28),
        gender: 'female',
        asthma_type: 'mixed',
        height_cm: 165,
        weight_kg: 60,
        email: 'ana.garcia@example.com',
        phone: '555-0202',
        profilePicture: avatarUrl('Ana García López'),
        latest_pef: 350,
        personalBestPEF: 400,
        status: 'Moderado',
        riskLevel: 'yellow',
        adherence: 85,
        lastUpdate: 'Hace 30 min',
        currentSpO2: 95,
        respiratoryRate: 18,
        history: [],
        background: {
            diagnosis: 'Asma Moderada',
            allergies: ['Gatos'],
            hereditary: [],
            smoking: false
        },
        contact: {
            name: 'Juan García',
            relation: 'Padre',
            phone: '555-0203'
        },
        medications: []
    },
    {
        id: 'P-00125',
        firebase_uid: 'uid_125',
        full_name: 'Carlos Rodríguez',
        date_of_birth: getDob(45),
        gender: 'male',
        asthma_type: 'non_allergic',
        height_cm: 180,
        weight_kg: 90,
        email: 'carlos.rod@example.com',
        phone: '555-0303',
        profilePicture: avatarUrl('Carlos Rodríguez'),
        latest_pef: 500,
        personalBestPEF: 510,
        status: 'Estable',
        riskLevel: 'green',
        adherence: 95,
        lastUpdate: 'Hace 1 hora',
        currentSpO2: 98,
        respiratoryRate: 16,
        history: [],
        background: {
            diagnosis: 'Asma Leve',
            allergies: [],
            hereditary: [],
            smoking: true
        },
        contact: { name: 'Luisa', relation: 'Hermana', phone: '555' },
        medications: []
    },
    ...Array.from({ length: 17 }, (_, i) => {
        const idNum = 126 + i;
        const isCritical = i % 10 === 0;
        const isModerate = i % 5 === 0 && !isCritical;
        const gender = i % 2 === 0 ? 'male' : 'female';
        const name = `Paciente Generado ${i + 1}`;

        return {
            id: `P-00${idNum}`,
            firebase_uid: `uid_${idNum}`,
            full_name: name,
            date_of_birth: getDob(20 + Math.floor(Math.random() * 40)),
            gender: gender,
            asthma_type: i % 3 === 0 ? 'allergic' : (i % 3 === 1 ? 'exercise_induced' : 'mixed'),
            height_cm: 160 + Math.floor(Math.random() * 30),
            weight_kg: 50 + Math.floor(Math.random() * 50),
            email: `patient${idNum}@example.com`,
            phone: `555-0${idNum}`,
            emergencyContact: {
                name: `Familar ${idNum}`,
                phone: `555-9${idNum}`,
                relation: 'Familiar'
            },
            profilePicture: avatarUrl(name),
            latest_pef: isCritical ? 200 : (isModerate ? 300 : 400 + Math.floor(Math.random() * 50)),
            personalBestPEF: 450,
            status: isCritical ? 'Crítico' : (isModerate ? 'Moderado' : 'Estable'),
            riskLevel: isCritical ? 'red' : (isModerate ? 'yellow' : 'green'),
            adherence: 60 + Math.floor(Math.random() * 40),
            lastUpdate: `Hace ${i + 2} horas`,
            currentSpO2: isCritical ? 88 : 98,
            respiratoryRate: isCritical ? 24 : 16,
            history: [],
            background: {
                diagnosis: isCritical ? 'Asma Severa' : 'Asma Leve',
                allergies: i % 2 === 0 ? ['Polen', 'Ácaros'] : [],
                hereditary: [],
                smoking: false
            },
            contact: {
                name: `Familar ${idNum}`,
                relation: 'Familiar',
                phone: `555-9${idNum}`
            },
            medications: [
                { name: 'Salbutamol', dosage: '100mcg', frequency: 'PRN' },
                { name: 'Fluticasona', dosage: '250mcg', frequency: '1 puff cada 12h' }
            ],
            pefTrend: Array.from({ length: 7 }, (_, k) => ({
                date: new Date(Date.now() - (6 - k) * 86400000).toISOString(),
                pefValue: 300 + Math.random() * 100,
                zone: 'green'
            })),
            documents: [],
            clinical_history: {
                identification: {
                    civil_status: 'Soltero',
                    religion: 'Ninguna',
                    education: 'Preparatoria',
                    occupation: 'Estudiante',
                    birth_place: 'Monterrey, NL',
                    blood_type: 'A+'
                },
                family_history: {
                    mother: 'Sana',
                    father: 'Hipertensión',
                    siblings: '1 Hermano (Sano)'
                },
                non_pathological: {
                    housing_type: 'Urbana',
                    services: ['Todos'],
                    hygiene: { bath_freq: 'Diario', dental_freq: '3/día' },
                    diet: 'Regular',
                    zoonosis: 'Ninguna',
                    physical_activity: 'Futbol fin de semana'
                },
                pathological: {
                    smoking: 'Ocasional', // 1/week
                    alcoholism: 'Social',
                    allergies: 'Ninguna',
                    surgeries: 'Ninguna',
                    trauma: 'Ninguno',
                    hospitalizations: 'Ninguna'
                }
            }
        };
    })
];
