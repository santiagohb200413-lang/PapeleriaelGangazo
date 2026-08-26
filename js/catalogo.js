// ============================================
// CATÁLOGO PÚBLICO
// Trae categorías, productos y configuración desde Supabase
// y maneja la búsqueda + el filtro de categoría en el navegador.
// ============================================

let TODOS_LOS_PRODUCTOS = [];
let CATEGORIAS = [];
let CATEGORIA_ACTIVA = 'todos';
let TEXTO_BUSQUEDA = '';
let WHATSAPP_NUMERO = '';

// Ícono por defecto si una categoría no tiene uno asignado
const ICONO_DEFAULT = 'ic-tag';

function normalizar(texto) {
  return (texto || '').toString().toLowerCase();
}

function linkWhatsApp(numero, mensaje) {
  const limpio = (numero || '').replace(/[^0-9]/g, '');
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
}

function formatoPrecio(valor) {
  if (valor === null || valor === undefined) return '';
  return '$' + Number(valor).toLocaleString('es-CO');
}

// ---------- CARGA DE CONFIGURACIÓN (nombre, logo, whatsapp, banner) ----------
async function cargarConfiguracion() {
  const { data, error } = await supabase
    .from('configuracion')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) {
    console.error('Error cargando configuración:', error);
    return;
  }

  WHATSAPP_NUMERO = data.whatsapp || '';

  document.getElementById('brand-name').textContent = data.nombre_negocio || 'Catálogo';
  document.getElementById('brand-tag').textContent = data.descripcion || '';
  document.getElementById('banner').textContent = data.mensaje_banner || '';
  document.title = data.nombre_negocio || 'Catálogo';

  const logoEl = document.getElementById('logo');
  if (data.logo_url) {
    logoEl.innerHTML = `<img src="${data.logo_url}" alt="Logo">`;
  } else {
    const iniciales = (data.nombre_negocio || 'CA').substring(0, 2).toUpperCase();
    logoEl.textContent = iniciales;
  }

  const msjGenerico = `Hola, quiero más información sobre sus productos.`;
  document.getElementById('wa-header').href = linkWhatsApp(WHATSAPP_NUMERO, msjGenerico);
  document.getElementById('wa-float').href = linkWhatsApp(WHATSAPP_NUMERO, msjGenerico);

  document.getElementById('footer-note').textContent =
    `${data.nombre_negocio || 'Nuestro negocio'} · Contáctanos por WhatsApp para más información.`;
}

// ---------- CARGA DE CATEGORÍAS ----------
async function cargarCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error cargando categorías:', error);
    return;
  }

  CATEGORIAS = data || [];
  renderizarCategorias();
}

function renderizarCategorias() {
  const rail = document.getElementById('cat-rail');

  const chipTodos = `
    <div class="cat-chip ${CATEGORIA_ACTIVA === 'todos' ? 'active' : ''}" data-cat="todos">
      <span class="icon-circle"><svg class="icon" style="width:14px;height:14px"><use href="#ic-grid"/></svg></span>
      Todos
    </div>`;

  const chipsCategorias = CATEGORIAS.map(cat => `
    <div class="cat-chip ${CATEGORIA_ACTIVA === cat.id ? 'active' : ''}" data-cat="${cat.id}">
      <span class="icon-circle"><svg class="icon" style="width:14px;height:14px"><use href="#${cat.icono || ICONO_DEFAULT}"/></svg></span>
      ${cat.nombre}
    </div>`).join('');

  rail.innerHTML = chipTodos + chipsCategorias;

  rail.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      CATEGORIA_ACTIVA = chip.dataset.cat === 'todos' ? 'todos' : chip.dataset.cat;
      renderizarCategorias();
      renderizarProductos();
    });
  });
}

// ---------- CARGA DE PRODUCTOS ----------
async function cargarProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*, categorias(nombre, icono)')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error cargando productos:', error);
    return;
  }

  TODOS_LOS_PRODUCTOS = data || [];
  renderizarProductos();
}

function productosFiltrados() {
  return TODOS_LOS_PRODUCTOS.filter(p => {
    const coincideCategoria = CATEGORIA_ACTIVA === 'todos' || p.categoria_id === CATEGORIA_ACTIVA;
    const coincideTexto =
      normalizar(p.nombre).includes(TEXTO_BUSQUEDA) ||
      normalizar(p.descripcion).includes(TEXTO_BUSQUEDA) ||
      normalizar(p.categorias?.nombre).includes(TEXTO_BUSQUEDA);
    return coincideCategoria && coincideTexto;
  });
}

function renderizarProductos() {
  const grid = document.getElementById('grid');
  const emptyState = document.getElementById('empty-state');
  const contador = document.getElementById('contador');

  const lista = productosFiltrados();
  contador.textContent = `${lista.length} producto${lista.length === 1 ? '' : 's'}`;

  if (lista.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  grid.innerHTML = lista.map(p => {
    const icono = p.categorias?.icono || ICONO_DEFAULT;
    const imagen = p.imagen_url
      ? `<img src="${p.imagen_url}" alt="${p.nombre}">`
      : `<svg class="icon" viewBox="0 0 24 24" style="width:34px;height:34px;stroke-width:1.5"><use href="#${icono}"/></svg>`;

    const precioTexto = p.precio !== null && p.precio !== undefined
      ? `<div class="card-price">${formatoPrecio(p.precio)}</div>`
      : '';

    const precioMayorTexto = (p.precio_mayorista && p.cantidad_minima_mayorista)
      ? `<div class="card-price-mayor">${formatoPrecio(p.precio_mayorista)} c/u desde ${p.cantidad_minima_mayorista} und.</div>`
      : '';

    const mensajeWa = `Hola, estoy interesado en este producto:\n\n*${p.nombre}*\n${p.precio ? formatoPrecio(p.precio) : ''}\n\n¿Podrían brindarme más información?`;

    return `
      <div class="card">
        <div class="card-img">${imagen}</div>
        <div class="card-body">
          <div class="card-cat">${p.categorias?.nombre || ''}</div>
          <div class="card-name">${p.nombre}</div>
          ${p.descripcion ? `<div class="card-desc">${p.descripcion}</div>` : ''}
          ${precioTexto}
          ${precioMayorTexto}
          <a class="card-cta" href="${linkWhatsApp(WHATSAPP_NUMERO, mensajeWa)}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.6.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.5-.9-.8-1.4-1.8-1.6-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.8-2-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.5 5.2L2 22l4.9-1.4c1.5.8 3.2 1.3 5.1 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.1c-1.7 0-3.3-.5-4.7-1.3l-.3-.2-3.2.9.9-3.1-.2-.3C3.5 14 3 12.5 3 11c0-5 4-9 9-9s9 4 9 9-4 9-9 9z"/></svg>
            Consultar
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// ---------- BUSCADOR ----------
document.getElementById('buscador').addEventListener('input', (e) => {
  TEXTO_BUSQUEDA = normalizar(e.target.value);
  renderizarProductos();
});

// ---------- INICIO ----------
async function iniciar() {
  await Promise.all([
    cargarConfiguracion(),
    cargarCategorias(),
    cargarProductos()
  ]);
}

iniciar();
