// ============================================
// CATEGORÍAS — listar, crear, editar, eliminar
// ============================================

const ICONOS_DISPONIBLES = [
  'ic-book', 'ic-pencil', 'ic-drop', 'ic-briefcase',
  'ic-bag', 'ic-gift', 'ic-ruler', 'ic-printer', 'ic-tag'
];

let CATEGORIAS_ADMIN = [];
let CATEGORIA_EDITANDO = null;
let ICONO_SELECCIONADO = ICONOS_DISPONIBLES[0];

async function cargarCategoriasAdmin() {
  const { data, error } = await sb
    .from('categorias')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    mostrarToast('Error cargando categorías');
    console.error(error);
    return;
  }

  CATEGORIAS_ADMIN = data || [];
  renderizarTablaCategorias();
  renderizarSelectCategoriasEnProductos();
}

function renderizarTablaCategorias() {
  const tbody = document.getElementById('tbody-categorias');

  if (CATEGORIAS_ADMIN.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Todavía no hay categorías. Crea la primera con "Nueva categoría".</td></tr>`;
    return;
  }

  tbody.innerHTML = CATEGORIAS_ADMIN.map(cat => `
    <tr>
      <td>
        <div class="prod-cell">
          <div class="prod-thumb"><svg class="icon"><use href="#${cat.icono || 'ic-tag'}"/></svg></div>
          <div class="prod-name">${cat.nombre}</div>
        </div>
      </td>
      <td>${cat.orden ?? 0}</td>
      <td>
        ${cat.activo
          ? `<span class="status-pill visible"><svg><use href="#ic-check-circle"/></svg>Activa</span>`
          : `<span class="status-pill oculto"><svg><use href="#ic-x-circle"/></svg>Inactiva</span>`}
      </td>
      <td>
        <div class="row-actions">
          <button title="Editar" onclick="abrirModalCategoria('${cat.id}')"><svg><use href="#ic-edit"/></svg></button>
          <button title="Eliminar" onclick="eliminarCategoria('${cat.id}')"><svg><use href="#ic-trash"/></svg></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderizarIconSelectGrid() {
  const grid = document.getElementById('icon-select-grid');
  grid.innerHTML = ICONOS_DISPONIBLES.map(ic => `
    <div class="icon-opt ${ic === ICONO_SELECCIONADO ? 'selected' : ''}" data-icon="${ic}" onclick="seleccionarIcono('${ic}')">
      <svg class="icon"><use href="#${ic}"/></svg>
    </div>
  `).join('');
}

function seleccionarIcono(ic) {
  ICONO_SELECCIONADO = ic;
  renderizarIconSelectGrid();
}

function abrirModalCategoria(id = null) {
  CATEGORIA_EDITANDO = id;
  const cat = id ? CATEGORIAS_ADMIN.find(c => c.id === id) : null;

  document.getElementById('modal-categoria-titulo').textContent = cat ? 'Editar categoría' : 'Nueva categoría';
  document.getElementById('cat-nombre').value = cat?.nombre || '';
  document.getElementById('cat-orden').value = cat?.orden ?? 0;
  document.getElementById('cat-activo').checked = cat ? cat.activo : true;
  ICONO_SELECCIONADO = cat?.icono || ICONOS_DISPONIBLES[0];
  renderizarIconSelectGrid();

  document.getElementById('modal-categoria').classList.add('active');
}

function cerrarModalCategoria() {
  document.getElementById('modal-categoria').classList.remove('active');
  CATEGORIA_EDITANDO = null;
}

async function guardarCategoria(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-guardar-categoria');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  const payload = {
    nombre: document.getElementById('cat-nombre').value.trim(),
    orden: Number(document.getElementById('cat-orden').value) || 0,
    activo: document.getElementById('cat-activo').checked,
    icono: ICONO_SELECCIONADO
  };

  let error;
  if (CATEGORIA_EDITANDO) {
    ({ error } = await sb.from('categorias').update(payload).eq('id', CATEGORIA_EDITANDO));
  } else {
    ({ error } = await sb.from('categorias').insert(payload));
  }

  btn.disabled = false;
  btn.textContent = 'Guardar';

  if (error) {
    mostrarToast('Error guardando la categoría');
    console.error(error);
    return;
  }

  mostrarToast('Categoría guardada');
  cerrarModalCategoria();
  cargarCategoriasAdmin();
}

async function eliminarCategoria(id) {
  const enUso = PRODUCTOS_ADMIN.some(p => p.categoria_id === id);
  const mensaje = enUso
    ? '¿Eliminar esta categoría? Hay productos que la usan y quedarán sin categoría.'
    : '¿Eliminar esta categoría?';

  if (!confirm(mensaje)) return;

  const { error } = await sb.from('categorias').delete().eq('id', id);
  if (error) {
    mostrarToast('Error eliminando la categoría');
    console.error(error);
    return;
  }
  mostrarToast('Categoría eliminada');
  cargarCategoriasAdmin();
  cargarProductosAdmin();
}

document.getElementById('form-categoria').addEventListener('submit', guardarCategoria);
