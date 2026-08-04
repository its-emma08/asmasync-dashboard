// Roles válidos según backend (app/api/v1/.../admin.py change_user_role)
export const VALID_ROLES = ['admin', 'doctor', 'nurse', 'patient'] as const;

export type RoleType = (typeof VALID_ROLES)[number];

export const ROLE_LABELS: Record<RoleType, string> = {
    admin: 'Administrador',
    doctor: 'Médico',
    nurse: 'Enfermero/a',
    patient: 'Paciente',
};

/** Normaliza un string de rol al conjunto válido (fallback 'patient'). */
export function normalizeRole(role: unknown): RoleType {
    const value = typeof role === 'string' ? role.toLowerCase().trim() : '';
    return (VALID_ROLES as readonly string[]).includes(value)
        ? (value as RoleType)
        : 'patient';
}

export function roleLabel(role: unknown): string {
    return ROLE_LABELS[normalizeRole(role)];
}
