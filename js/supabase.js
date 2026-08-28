// ============================================
// CONEXIÓN CON SUPABASE
// ============================================
// La "publishable key" es segura para usar en el navegador
// siempre que las políticas RLS estén bien configuradas
// (ya lo están: público solo puede LEER, admin autenticado puede escribir).

const SUPABASE_URL = 'https://fjsjpeilarddcmqhrdef.supabase.co';
const SUPABASE_KEY = 'sb_publishable_mk5JneekxHS9eWVauE7a1w_4AOOj9zy';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
