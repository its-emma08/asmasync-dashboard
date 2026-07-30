export type RiskLevel = 'high' | 'moderate' | 'low' | 'unknown';

export interface RiskConfig {
  label: string;
  color: string;
  cssClass: string;
  icon: string;
  priority: number;
}

export const RISK_CONFIG: Record<RiskLevel, RiskConfig> = {
  high:     { label: 'Alto',        color: '#dc2626', cssClass: 'bg-red-50 text-brand-coral border border-red-100',     icon: 'local_fire_department', priority: 3 },
  moderate: { label: 'Medio',       color: '#d97706', cssClass: 'bg-yellow-50 text-[#FFB547] border border-yellow-100', icon: 'warning_amber',         priority: 2 },
  low:      { label: 'Bajo',        color: '#16a34a', cssClass: 'bg-green-50 text-brand-green border border-green-100', icon: 'check_circle',          priority: 1 },
  unknown:  { label: 'Desconocido', color: '#6b7280', cssClass: 'bg-gray-50 text-gray-500',                           icon: 'help_outline',          priority: 0 },
};
