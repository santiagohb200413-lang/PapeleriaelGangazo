// ============================================
// PRODUCTOS — listar, crear, editar, eliminar, ocultar/mostrar
// ============================================

let PRODUCTOS_ADMIN = [];
let PRODUCTO_EDITANDO = null;
let IMAGEN_NUEVA_BLOB = null;
let IMAGEN_URL_ACTUAL = null;
let TEXTO_BUSQUEDA_ADMIN = '';

async function cargarProductosAdmin() {
  const { data, error } = await supabase
    .from('productos')
    .select('*, categorias(nombre, icono)')
    .order('created_at', { ascending: false });

  if (error) {
    mostrarToast('Error cargando productos');
    console.error(error);
    return;
  }

  PRODUCTOS_ADMIN = data || [];
  renderizarTablaProductos();
}

function productosAdminFiltrados() {
  const texto = TEXTO_BUSQUEDA_ADMIN.toLowerCase();
  if (!texto) return PRODUCTOS_ADMIN;
  return PRODUCTOS_ADMIN.filter(p =>
    p.nombre.toLowerCase().includes(texto) ||
    (p.categorias?.nombre || '').toLowerCase().includes(texto)
  );
}

function renderizarTablaProductos() {
  const tbody = document.getElementById('tbody-productos');
  const lista = productosAdminFiltrados();

  if (lista.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No hay productos para mostrar. Crea el primero con "Nuevo producto".</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(p => {
    const thumb = p.imagen_url
      ? `<img src="${p.imagen_url}" alt="">`
      : `<svg class="icon"><use href="#${p.categorias?.icono || 'ic-tag'}"/></svg>`;
    const fecha = p.created_at ? new Date(p.created_at).toLocaleDateString('es-CO') : '—';

    return `
      <tr>
        <td>
          <div class="prod-cell">
            <div class="prod-thumb">${thumb}</div>
            <div class="prod-name">${p.nombre}</div>
          </div>
        </td>
        <td><span class="cat-pill">${p.categorias?.nombre || 'Sin categoría'}</span></td>
        <td>${p.precio !== null && p.precio !== undefined ? '$' + Number(p.precio).toLocaleString('es-CO') : '—'}</td>
        <td>
          ${p.activo
            ? `<span class="status-pill visible"><svg><use href="#ic-check-circle"/></svg>Visible</span>`
            : `<span class="status-pill oculto"><svg><use href="#ic-x-circle"/></svg>Oculto</span>`}
        </td>
        <td>${fecha}</td>
        <td>
          <div class="row-actions">
            <button title="Editar" onclick="abrirModalProducto('${p.id}')"><svg><use href="#ic-edit"/></svg></button>
            <button title="${p.activo ? 'Ocultar' : 'Mostrar'}" onclick="alternarVisibilidadProducto('${p.id}', ${p.activo})"><svg><use href="#${p.activo ? 'ic-eye-off' : 'ic-eye'}"/></svg></button>
            <button title="Eliminar" onclick="eliminarProducto('${p.id}')"><svg><use href="#ic-trash"/></svg></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderizarSelectCategoriasEnProductos() {
  const select = document.getElementById('prod-categoria');
  select.innerHTML = '<option value="">Sin categoría</option>' +
    CATEGORIAS_ADMIN.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
}

function abrirModalProducto(id = null) {
  PRODUCTO_EDITANDO = id;
  IMAGEN_NUEVA_BLOB = null;
  const p = id ? PRODUCTOS_ADMIN.find(x => x.id === id) : null;

  document.getElementById('modal-producto-titulo').textContent = p ? 'Editar producto' : 'Nuevo producto';
  document.getElementById('prod-nombre').value = p?.nombre || '';
  document.getElementById('prod-descripcion').value = p?.descripcion || '';
  document.getElementById('prod-precio').value = p?.precio ?? '';
  document.getElementById('prod-precio-mayorista').value = p?.precio_mayorista ?? '';
  document.getElementById('prod-cantidad-mayorista').value = p?.cantidad_minima_mayorista ?? '';
  document.getElementById('prod-categoria').value = p?.categoria_id || '';
  document.getElementById('prod-activo').checked = p ? p.activo : true;

  IMAGEN_URL_ACTUAL = p?.imagen_url || null;
  actualizarPreviewImagen(IMAGEN_URL_ACTUAL);

  document.getElementById('input-imagen-producto').value = '';
  document.getElementById('modal-producto').classList.add('active');
}

function cerrarModalProducto() {
  document.getElementById('modal-producto').classList.remove('active');
  PRODUCTO_EDITANDO = null;
  IMAGEN_NUEVA_BLOB = null;
}

function actualizarPreviewImagen(url) {
  const preview = document.getElementById('img-preview');
  preview.innerHTML = url
    ? `<img src="${url}" alt="">`
    : `<svg class="icon" style="width:26px;height:26px;color:var(--slate)"><use href="#ic-box"/></svg>`;
}

async function manejarSeleccionImagen(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    IMAGEN_NUEVA_BLOB = await optimizarImagen(file);
    actualizarPreviewImagen(URL.createObjectURL(IMAGEN_NUEVA_BLOB));
  } catch (err) {
    mostrarToast(err.message || 'No se pudo procesar la imagen');
    console.error(err);
  }
}

async function guardarProducto(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-guardar-producto');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    let imagenUrl = IMAGEN_URL_ACTUAL;

    if (IMAGEN_NUEVA_BLOB) {
      const nombreBase = document.getElementById('prod-nombre').value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'producto';
      imagenUrl = await subirImagen(IMAGEN_NUEVA_BLOB, nombreBase);
    }

    const payload = {
      nombre: document.getElementById('prod-nombre').value.trim(),
      descripcion: document.getElementById('prod-descripcion').value.trim() || null,
      precio: document.getElementById('prod-precio').value ? Number(document.getElementById('prod-precio').value) : null,
      precio_mayorista: document.getElementById('prod-precio-mayorista').value ? Number(document.getElementById('prod-precio-mayorista').value) : null,
      cantidad_minima_mayorista: document.getElementById('prod-cantidad-mayorista').value ? Number(document.getElementById('prod-cantidad-mayorista').value) : null,
      categoria_id: document.getElementById('prod-categoria').value || null,
      activo: document.getElementById('prod-activo').checked,
      imagen_url: imagenUrl
    };

    let error;
    if (PRODUCTO_EDITANDO) {
      ({ error } = await supabase.from('productos').update(payload).eq('id', PRODUCTO_EDITANDO));
    } else {
      ({ error } = await supabase.from('productos').insert(payload));
    }

    if (error) throw error;

    mostrarToast('Producto guardado');
    cerrarModalProducto();
    cargarProductosAdmin();
  } catch (err) {
    mostrarToast('Error guardando el producto');
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
}

async function alternarVisibilidadProducto(id, activoActual) {
  const { error } = await supabase.from('productos').update({ activo: !activoActual }).eq('id', id);
  if (error) {
    mostrarToast('Error actualizando el producto');
    console.error(error);
    return;
  }
  cargarProductosAdmin();
}

async function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;

  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) {
    mostrarToast('Error eliminando el producto');
    console.error(error);
    return;
  }
  mostrarToast('Producto eliminado');
  cargarProductosAdmin();
}

document.getElementById('form-producto').addEventListener('submit', guardarProducto);
document.getElementById('input-imagen-producto').addEventListener('change', manejarSeleccionImagen);
document.getElementById('buscador-productos').addEventListener('input', (e) => {
  TEXTO_BUSQUEDA_ADMIN = e.target.value;
  renderizarTablaProductos();
});
