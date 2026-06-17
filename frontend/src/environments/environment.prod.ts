export const environment = {
  production: true,
  mockMode: false,

  // ─── Producción: Render con todos los endpoints integrados ────────────────
  apiUrl: 'https://asthma-predictor-api.onrender.com/api',
  renderApiUrl: 'https://asthma-predictor-api.onrender.com/api',

  // ─── WebSocket ──────────────────────────────────────────────────────────────
  wsUrl: 'wss://asthma-predictor-api.onrender.com/ws',

  // ─── Keys ───────────────────────────────────────────────────────────────────
  dashboardApiKey: 'juanpi-secret-dashboard-key-2025',
  vapidPublicKey: 'BBy6c-J67D3v9m1Tf9F8...placeholder...',
  openWeatherApiKey: '',
  storageEncryptionKey: 'YOUR_STORAGE_ENCRYPTION_KEY_HERE',

  // ─── Supabase ───────────────────────────────────────────────────────────────
  supabaseUrl: 'https://gspjcaqonnvrzuviqrjq.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcGpjYXFvbm52cnp1dmlxcmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4Njk5NjMsImV4cCI6MjA4MjQ0NTk2M30.H-V78osW0tkcTfFQbIKKtEAdoEbhyQnVznwQCTiyOWw',
  supabaseServiceRoleKey: 'YOUR_SERVICE_ROLE_KEY_HERE'
};
