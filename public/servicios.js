const usuario = JSON.parse(localStorage.getItem('usuario'));
if (!usuario) location.href = 'index.html';

const esAdmin = usuario.rol === 'admin';
if (esAdmin) document.getElementById('admin').style.display = 'block';

let servicios = [];
let editandoId = null;

const sNombre = document.getElementById('sNombre');
const sCategoria = document.getElementById('sCategoria');
const sCategoriaOtro = document.getElementById('sCategoriaOtro');
const sDuracion = document.getElementById('sDuracion');
const sPrecio = document.getElementById('sPrecio');
const btnAgregar = document.getElementById('btnAgregar');
const btnCancelar = document.getElementById('btnCancelar');
const tituloForm = document.getElementById('tituloForm');
const msg = document.getElementById('msg');

const NOMBRES = { unas: 'Uñas', cabello: 'Cabello' };

function esc(t) {
  const e = document.createElement('div');
  e.textContent = t ?? '';
  return e.innerHTML;
}
function nombreCategoria(c) {
  return NOMBRES[c] || (c.charAt(0).toUpperCase() + c.slice(1));
}

sCategoria.addEventListener('change', () => {
  sCategoriaOtro.style.display = sCategoria.value === 'otro' ? 'block' : 'none';
  if (sCategoria.value === 'otro') sCategoriaOtro.focus();
});

async function cargar() {
  const lista = document.getElementById('lista');
  try {
    const r = await fetch(`${API}/servicios.php?local_id=${usuario.local_id}`);
    servicios = await r.json();
    lista.innerHTML = '';
    if (!servicios.length) {
      lista.innerHTML = '<p>Este local todavía no cargó sus servicios.</p>';
      return;
    }
    let catActual = '';

    servicios.forEach(s => {
      if (s.categoria !== catActual) {
        catActual = s.categoria;
        lista.insertAdjacentHTML('beforeend', `<h2 class="cat">${esc(nombreCategoria(catActual))}</h2>`);
      }
      const h = Math.floor(s.duracion_min / 60);
      const m = s.duracion_min % 60;
      const duracion = h ? `${h} h${m ? ' ' + m + ' min' : ''}` : `${m} min`;
      lista.insertAdjacentHTML('beforeend', `
        <div class="card">
          <h3>${esc(s.nombre)}</h3>
          <small>${duracion} · $${Number(s.precio).toLocaleString('es-AR')}</small>
          ${esAdmin ? `
            <div class="acciones">
              <button class="editar" onclick="editar(${s.id})">Editar</button>
              <button class="borrar" onclick="borrar(${s.id})">Eliminar</button>
            </div>` : ''}
        </div>`);
    });
  } catch (e) {
    lista.innerHTML = '<p>No se pudieron cargar los servicios.</p>';
  }
}

function limpiarForm() {
  editandoId = null;
  sNombre.value = '';
  sDuracion.value = '';
  sPrecio.value = '';
  sCategoria.value = 'unas';
  sCategoriaOtro.value = '';
  sCategoriaOtro.style.display = 'none';
  tituloForm.textContent = 'Agregar servicio';
  btnAgregar.textContent = 'Guardar';
  btnCancelar.style.display = 'none';
}

function editar(id) {
  const s = servicios.find(x => Number(x.id) === id);
  if (!s) return;
  editandoId = id;
  sNombre.value = s.nombre;
  if (s.categoria === 'unas' || s.categoria === 'cabello') {
    sCategoria.value = s.categoria;
    sCategoriaOtro.style.display = 'none';
    sCategoriaOtro.value = '';
  } else {
    sCategoria.value = 'otro';
    sCategoriaOtro.value = s.categoria;
    sCategoriaOtro.style.display = 'block';
  }
  sDuracion.value = s.duracion_min;
  sPrecio.value = Math.round(Number(s.precio));
  tituloForm.textContent = 'Editar servicio';
  btnAgregar.textContent = 'Guardar cambios';
  btnCancelar.style.display = 'block';
  msg.textContent = '';
  document.getElementById('admin').scrollIntoView({ behavior: 'smooth' });
}

btnCancelar.addEventListener('click', limpiarForm);

btnAgregar.addEventListener('click', async () => {
  let categoria = sCategoria.value;
  if (categoria === 'otro') categoria = sCategoriaOtro.value.trim().toLowerCase();

  const datos = {
    local_id: usuario.local_id,
    nombre: sNombre.value.trim(),
    categoria,
    duracion_min: parseInt(sDuracion.value),
    precio: parseFloat(sPrecio.value)
  };

  if (!datos.nombre || !datos.categoria || !(datos.duracion_min > 0) || !(datos.precio > 0)) {
    msg.textContent = 'Completá todos los campos con valores válidos (y la categoría si elegiste "Otro")';
    return;
  }

  try {
    if (editandoId) {
      datos.id = editandoId;
      await fetch(API + '/servicios.php', { method: 'PUT', body: JSON.stringify(datos) });
    } else {
      await fetch(API + '/servicios.php', { method: 'POST', body: JSON.stringify(datos) });
    }
    msg.textContent = '';
    limpiarForm();
    cargar();
  } catch (e) {
    msg.textContent = 'No se pudo guardar. Revisá la conexión.';
  }
});

async function borrar(id) {
  if (!confirm('¿Eliminar este servicio?')) return;
  await fetch(API + '/servicios.php', { method: 'DELETE', body: JSON.stringify({ id, local_id: usuario.local_id }) });
  if (editandoId === id) limpiarForm();
  cargar();
}

cargar();