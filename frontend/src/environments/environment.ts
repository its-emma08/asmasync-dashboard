export const environment = {
  production: false,
  mockMode: false,
  
  apiUrl: 'https://asthma-predictor-api.onrender.com/api',
  renderApiUrl: 'https://asthma-predictor-api.onrender.com/api',

  // ─── WebSocket ──────────────────────────────────────────────────────────────
  wsUrl: 'wss://asthma-predictor-api.onrender.com/api/measurements/ws/trend',

  // ─── Keys ───────────────────────────────────────────────────────────────────
  dashboardApiKey: 'juanpi-secret-dashboard-key-2025', // TODO: Rotar clave antes de deploy — coordinar con Pablo
  vapidPublicKey: 'BBy6c-J67D3v9m1Tf9F8...placeholder...',
  openWeatherApiKey: '', // No usada — weather usa Open-Meteo (sin clave)
  storageEncryptionKey: 'asmasync-dev-key-replace-in-prod',

  // ─── Supabase ───────────────────────────────────────────────────────────────
  supabaseUrl: 'https://gspjcaqonnvrzuviqrjq.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcGpjYXFvbm52cnp1dmlxcmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4Njk5NjMsImV4cCI6MjA4MjQ0NTk2M30.H-V78osW0tkcTfFQbIKKtEAdoEbhyQnVznwQCTiyOWw',
  // TODO: Mover flujo de invitar-doctor al backend (POST /api/admin/invite-doctor).
  // Mientras tanto esta clave no va a producción — environment.prod.ts ya tiene placeholder.
  supabaseServiceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcGpjYXFvbm52cnp1dmlxcmpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njg2OTk2MywiZXhwIjoyMDgyNDQ1OTYzfQ.K0GuUYwnS8kDUIiz6Ofclw7kQOhZUbLDz3X4GE3_REI'
};
