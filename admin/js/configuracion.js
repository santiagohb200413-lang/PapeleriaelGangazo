// ============================================
// CONFIGURACIÓN DE LA TIENDA
// ============================================

let LOGO_NUEVO_BLOB = null;
let LOGO_ELIMINADO = false;
let BANNER_IMG_NUEVO_BLOB = null;
let BANNER_IMG_ELIMINADO = false;

async function cargarConfiguracionAdmin() {
  const { data, error } = await sb.from('configuracion').select('*').eq('id', 1).single();
  if (error) {
    mostrarToast('Error cargando la configuración');
    console.error(error);
    return;
  }

  LOGO_NUEVO_BLOB = null;
  LOGO_ELIMINADO = false;
  BANNER_IMG_NUEVO_BLOB = null;
  BANNER_IMG_ELIMINADO = false;

  document.getElementById('cfg-nombre').value = data.nombre_negocio || '';
  document.getElementById('cfg-descripcion').value = data.descripcion || '';
  document.getElementById('cfg-color').value = data.color_primario || '#20242E';
  document.getElementById('cfg-telefono').value = data.telefono || '';
  document.getElementById('cfg-whatsapp').value = data.whatsapp || '';
  document.getElementById('cfg-banner').value = data.mensaje_banner || '';

  actualizarPreviewLogo(data.logo_url);
  actualizarPreviewBannerImagen(data.banner_url);

  // refleja el nombre/logo también en el sidebar del propio panel
  document.getElementById('sb-name-texto').textContent = data.nombre_negocio || 'Panel admin';
  document.getElementById('sb-logo').innerHTML = data.logo_url
    ? `<img src="${data.logo_url}" alt="">`
    : escapar((data.nombre_negocio || 'CA').substring(0, 2).toUpperCase());
}

function quitarLogo() {
  LOGO_NUEVO_BLOB = null;
  LOGO_ELIMINADO = true;
  document.getElementById('input-logo').value = '';
  actualizarPreviewLogo(null);
}

function actualizarPreviewLogo(url) {
  const preview = document.getElementById('logo-preview');
  preview.innerHTML = url
    ? `<img src="${url}" alt="">`
    : `<svg class="icon" style="width:26px;height:26px;color:var(--slate)"><use href="#ic-box"/></svg>`;
}

function actualizarPreviewBannerImagen(url) {
  const preview = document.getElementById('banner-img-preview');
  preview.innerHTML = url
    ? `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;">`
    : `<svg class="icon" style="width:26px;height:26px;color:var(--slate)"><use href="#ic-box"/></svg>`;
}

function quitarBannerImagen() {
  BANNER_IMG_NUEVO_BLOB = null;
  BANNER_IMG_ELIMINADO = true;
  document.getElementById('input-banner-img').value = '';
  actualizarPreviewBannerImagen(null);
}

async function manejarSeleccionBannerImagen(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    BANNER_IMG_NUEVO_BLOB = await optimizarImagen(file);
    BANNER_IMG_ELIMINADO = false;
    actualizarPreviewBannerImagen(URL.createObjectURL(BANNER_IMG_NUEVO_BLOB));
  } catch (err) {
    mostrarToast(err.message || 'No se pudo procesar la imagen');
    console.error(err);
  }
}

async function manejarSeleccionLogo(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    LOGO_NUEVO_BLOB = await optimizarImagen(file);
    LOGO_ELIMINADO = false;
    actualizarPreviewLogo(URL.createObjectURL(LOGO_NUEVO_BLOB));
  } catch (err) {
    mostrarToast(err.message || 'No se pudo procesar la imagen');
    console.error(err);
  }
}

async function guardarConfiguracion(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-guardar-configuracion');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    const payload = {
      nombre_negocio: document.getElementById('cfg-nombre').value.trim(),
      descripcion: document.getElementById('cfg-descripcion').value.trim() || null,
      color_primario: document.getElementById('cfg-color').value,
      telefono: document.getElementById('cfg-telefono').value.trim() || null,
      whatsapp: document.getElementById('cfg-whatsapp').value.trim() || null,
      mensaje_banner: document.getElementById('cfg-banner').value.trim() || null
    };

    if (LOGO_NUEVO_BLOB) {
      payload.logo_url = await subirImagen(LOGO_NUEVO_BLOB, 'logo-tienda');
    } else if (LOGO_ELIMINADO) {
      payload.logo_url = null;
    }

    if (BANNER_IMG_NUEVO_BLOB) {
      payload.banner_url = await subirImagen(BANNER_IMG_NUEVO_BLOB, 'banner-tienda');
    } else if (BANNER_IMG_ELIMINADO) {
      payload.banner_url = null;
    }

    const { error } = await sb.from('configuracion').update(payload).eq('id', 1);
    if (error) throw error;

    mostrarToast('Configuración guardada');
    LOGO_NUEVO_BLOB = null;
    LOGO_ELIMINADO = false;
    BANNER_IMG_NUEVO_BLOB = null;
    BANNER_IMG_ELIMINADO = false;
    cargarConfiguracionAdmin();
  } catch (err) {
    mostrarToast('Error guardando la configuración');
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar cambios';
  }
}

document.getElementById('form-configuracion').addEventListener('submit', guardarConfiguracion);
document.getElementById('input-logo').addEventListener('change', manejarSeleccionLogo);
document.getElementById('input-banner-img').addEventListener('change', manejarSeleccionBannerImagen);
