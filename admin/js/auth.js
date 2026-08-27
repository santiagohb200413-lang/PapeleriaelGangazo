// ============================================
// AUTENTICACIÓN DEL ADMIN
// ============================================

// Si ya hay sesión activa, no dejar ver el login: mandar directo al panel
async function redirigirSiYaHaySesion() {
  const { data } = await sb.auth.getSession();
  if (data.session) {
    window.location.href = 'index.html';
  }
}

// Si NO hay sesión activa, no dejar ver el panel: mandar al login
async function exigirSesion() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    window.location.href = 'login.html';
    return null;
  }
  return data.session;
}

async function iniciarSesion(email, password) {
  return await sb.auth.signInWithPassword({ email, password });
}

async function cerrarSesion() {
  await sb.auth.signOut();
  window.location.href = 'login.html';
}
