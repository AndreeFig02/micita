const usuario = JSON.parse(localStorage.getItem('usuario'));
if (!usuario) location.href = 'index.html';

const esAdmin = usuario.rol === 'admin';
if (esAdmin) document.getElementById('admin').style.display = 'block';

let servicios = [];
let editandoId = null;
let catAbierta = null; // categoría desplegada (se mantiene al recargar la lista)

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

function formatoDuracion(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h${m ? ' ' + m + ' min' : ''}` : `${m} min`;
}

const SVG_RELOJ = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

const SVG_EDITAR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const SVG_BORRAR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

function precioCorto(n) {
  return '$' + Number(n).toLocaleString('es-AR');
}

function tarjetaServicio(s) {
  return `
    <div class="card servicio">
      <div class="servicio-fila">
        <div class="servicio-info">
          <h3>${esc(s.nombre)}</h3>
          <small class="servicio-dur">${SVG_RELOJ} ${formatoDuracion(s.duracion_min)}</small>
        </div>
        <div class="servicio-lado">
          <span class="servicio-precio">${precioCorto(s.precio)}</span>
          ${esAdmin ? `
            <div class="servicio-acc">
              <button class="btn-icono ic-editar" onclick="editar(${s.id})" title="Editar" aria-label="Editar ${esc(s.nombre)}">${SVG_EDITAR}</button>
              <button class="btn-icono ic-borrar" onclick="borrar(${s.id})" title="Eliminar" aria-label="Eliminar ${esc(s.nombre)}">${SVG_BORRAR}</button>
            </div>` : `
            <button class="btn-reservar" onclick="reservar(${s.id})">Reservar</button>`}
        </div>
      </div>
    </div>`;
}

// Lleva a la pantalla de turnos con este servicio ya elegido
function reservar(id) {
  location.href = `turnos.html?servicio=${encodeURIComponent(id)}`;
}

function fijarBloque(bloque, abrir) {
  bloque.classList.toggle('abierto', abrir);
  bloque.querySelector('.bloque-cab').setAttribute('aria-expanded', abrir);
}

async function cargar() {
  const lista = document.getElementById('lista');
  if (!lista.children.length) lista.innerHTML = skeleton(3);
  try {
    const r = await fetch(`${API}/servicios.php?local_id=${usuario.local_id}`);
    servicios = await r.json();
    lista.innerHTML = '';
    if (!servicios.length) {
      lista.innerHTML = '<p>Este local todavía no cargó sus servicios.</p>';
      return;
    }

    // Agrupar por categoría
    const grupos = {};
    servicios.forEach(s => {
      (grupos[s.categoria] = grupos[s.categoria] || []).push(s);
    });

    Object.keys(grupos).forEach(cat => {
      const items = grupos[cat];
      const n = items.length;
      const precios = items.map(s => Number(s.precio));
      const pMin = Math.min(...precios);
      const pMax = Math.max(...precios);
      const textoPrecio = pMin === pMax ? precioCorto(pMin) : `desde ${precioCorto(pMin)}`;

      const bloque = document.createElement('div');
      bloque.className = 'bloque';
      bloque.innerHTML = `
        <div class="bloque-cab" role="button" tabindex="0" aria-expanded="false">
          <span class="bloque-icono">${iconoCategoria(cat)}</span>
          <span class="bloque-titulo">
            ${esc(nombreCategoria(cat))}
            <span class="bloque-cant">${n} servicio${n === 1 ? '' : 's'} · ${textoPrecio}</span>
          </span>
        </div>
        <div class="bloque-cuerpo">
          <div class="bloque-lista">
            <div class="bloque-interior">
              ${items.map(tarjetaServicio).join('')}
            </div>
          </div>
        </div>`;

      const cab = bloque.querySelector('.bloque-cab');
      const alternar = () => {
        const abrir = !bloque.classList.contains('abierto');
        // Solo un bloque abierto a la vez
        lista.querySelectorAll('.bloque.abierto').forEach(o => fijarBloque(o, false));
        fijarBloque(bloque, abrir);
        catAbierta = abrir ? cat : null;
      };

      cab.addEventListener('click', alternar);
      cab.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); }
      });

      lista.appendChild(bloque);
      if (cat === catAbierta) fijarBloque(bloque, true);
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
    toast('Servicio guardado', 'ok');
    limpiarForm();
    cargar();
  } catch (e) {
    msg.textContent = 'No se pudo guardar. Revisá la conexión.';
  }
});

async function borrar(id) {
  if (!await confirmar('¿Eliminar este servicio?', 'Eliminar')) return;
  await fetch(API + '/servicios.php', { method: 'DELETE', body: JSON.stringify({ id, local_id: usuario.local_id }) });
  if (editandoId === id) limpiarForm();
  cargar();
}

cargar();