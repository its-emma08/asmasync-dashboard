const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/environments/environment.prod.ts');

// Leer variables de entorno (o usar valores por defecto si no existen)
const apiUrl = process.env.API_URL || 'https://asthma-predictor-api.onrender.com/api';
const wsUrl = process.env.WS_URL || 'wss://asthma-predictor-api.onrender.com/ws';
const dashboardApiKey = process.env.DASHBOARD_API_KEY || 'juanpi-secret-dashboard-key-2025';
const storageEncryptionKey = process.env.STORAGE_ENCRYPTION_KEY || 'YOUR_STORAGE_ENCRYPTION_KEY_HERE';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

const envConfigFile = `export const environment = {
  production: true,
  mockMode: false,

  // ─── Producción: Render con todos los endpoints integrados ────────────────
  apiUrl: '${apiUrl}',
  renderApiUrl: '${apiUrl}',

  // ─── WebSocket ──────────────────────────────────────────────────────────────
  wsUrl: '${wsUrl}',

  // ─── Keys ───────────────────────────────────────────────────────────────────
  dashboardApiKey: '${dashboardApiKey}',
  vapidPublicKey: 'BBy6c-J67D3v9m1Tf9F8...placeholder...',
  openWeatherApiKey: '',
  storageEncryptionKey: '${storageEncryptionKey}',

  // ─── Supabase ───────────────────────────────────────────────────────────────
  supabaseUrl: 'https://gspjcaqonnvrzuviqrjq.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcGpjYXFvbm52cnp1dmlxcmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4Njk5NjMsImV4cCI6MjA4MjQ0NTk2M30.H-V78osW0tkcTfFQbIKKtEAdoEbhyQnVznwQCTiyOWw',
  supabaseServiceRoleKey: '${supabaseServiceRoleKey}'
};
`;

fs.writeFileSync(targetPath, envConfigFile, 'utf8');
console.log(`[set-env.js] Archivo environment.prod.ts generado exitosamente en ${targetPath}`);
