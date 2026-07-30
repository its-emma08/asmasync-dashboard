export interface User {
  id: string | number;
  email: string;
  full_name: string;
  role: 'admin' | 'doctor' | 'patient';
  is_2fa_enabled: boolean;
  doctor_code?: string;
  specialty?: string;
  phone?: string;
  certifications?: any[];
  created_at: string;
  settings?: UserSettings;
}

export interface UserSettings {
  twoFactor: boolean;
  pushNotifications: boolean;
  emailAlerts: boolean;
  smsAlerts: boolean;
  alertSound: boolean;
  criticalOnly: boolean;
  alertFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  privacyMode: boolean;
  autoLock: 0 | 5 | 15 | 30;
  sessionTimeout: 1 | 4 | 8 | 12;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  accentColor: string;
}

export interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entity_id?: string | number;
  user_id: string | number;
  ip_address?: string;
  user_agent?: string;
  changes?: any;
  created_at: string;
}

export interface UserSession {
  device: string;
  location: string;
  lastActive: string;
  icon: string;
  current: boolean;
}

export interface IoTDevice {
  id: string;
  name: string;
  model: string;
  status: 'online' | 'offline' | 'warning';
  battery: number;
  lastSync: string;
  patient?: string;
  icon: string;
  statusClass: string;
  dotClass: string;
}
