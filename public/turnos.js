const usuario = JSON.parse(localStorage.getItem('usuario'));
if (!usuario) location.href = 'index.html';
let horaElegida = null;

function iso(d) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function esc(t) {
  const e = document.createElement('div');
  e.textContent = t ?? '';
  return e.innerHTML;
}
function fechaAR(f) {
  const [a, m, d] = f.split('-');
  return `${d}/${m}/${a}`;
}

const hoy = iso(new Date());
const tFecha = document.getElementById('tFecha');
tFecha.min = hoy;
tFecha.value = hoy;
const msg = document.getElementById('msg');

let serviciosLista = [];

function formatoDuracion(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h${m ? ' ' + m + ' min' : ''}` : `${m} min`;
}

// Tarjeta con el servicio elegido y, cuando corresponde, el día y la hora
function actualizarResumen() {
  const cont = document.getElementById('resumenServicio');
  const s = serviciosLista.find(x => String(x.id) === document.getElementById('tServicio').value);
  if (!s) { cont.innerHTML = ''; return; }

  const cuando = horaElegida
    ? `<span class="resumen-cuando">${fechaAR(tFecha.value)} · ${esc(horaElegida)} hs</span>`
    : '<span class="resumen-pendiente">Elegí un horario para continuar</span>';

  cont.innerHTML = `
    <div class="resumen">
      <div class="resumen-fila">
        <span class="bloque-icono">${iconoCategoria(s.categoria)}</span>
        <div class="resumen-info">
          <strong>${esc(s.nombre)}</strong>
          <small>${formatoDuracion(s.duracion_min)}</small>
        </div>
        <span class="servicio-precio">$${Number(s.precio).toLocaleString('es-AR')}</span>
      </div>
      <div class="resumen-pie">${cuando}</div>
    </div>`;
}

async function cargarServicios() {
  try {
    const r = await fetch(`${API}/servicios.php?local_id=${usuario.local_id}`);
    const lista = await r.json();
    serviciosLista = lista;
    document.getElementById('tServicio').innerHTML = lista
      .map(s => `<option value="${s.id}">${esc(s.nombre)} (${s.duracion_min} min)</option>`).join('');

    // Si venimos desde "Reservar" en Servicios, dejar ese servicio elegido
    const pedido = new URLSearchParams(location.search).get('servicio');
    if (pedido && lista.some(s => String(s.id) === pedido)) {
      document.getElementById('tServicio').value = pedido;
    }
    cargarHoras();
  } catch (e) {
    msg.textContent = 'No se pudieron cargar los servicios';
  }
}

async function cargarHoras() {
  horaElegida = null;
  actualizarResumen();
  const sid = document.getElementById('tServicio').value;
  const cont = document.getElementById('horas');
  if (!sid || !tFecha.value) return;
  try {
    const r = await fetch(`${API}/turnos.php?disponibles=1&servicio_id=${sid}&fecha=${tFecha.value}&local_id=${usuario.local_id}`);
    const horas = await r.json();
    cont.innerHTML = horas.length
      ? horas.map(h => `<button class="hora" data-h="${h}">${h}</button>`).join('')
      : '<p>No hay horarios libres ese día.</p>';
    cont.querySelectorAll('.hora').forEach(b => b.addEventListener('click', () => {
      cont.querySelectorAll('.hora').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      horaElegida = b.dataset.h;
      actualizarResumen();
    }));
  } catch (e) {
    cont.innerHTML = '<p>No se pudieron cargar los horarios.</p>';
  }
}

document.getElementById('tServicio').addEventListener('change', cargarHoras);
tFecha.addEventListener('change', cargarHoras);

document.getElementById('btnConfirmar').addEventListener('click', async () => {
  if (!horaElegida) { msg.textContent = 'Elegí un horario'; return; }
  try {
    const r = await fetch(API + '/turnos.php', {
      method: 'POST',
      body: JSON.stringify({
        usuario_id: usuario.id,
        local_id: usuario.local_id,
        servicio_id: document.getElementById('tServicio').value,
        fecha: tFecha.value,
        hora: horaElegida
      })
    });
    const d = await r.json();
    msg.textContent = d.ok ? '' : d.error;
    if (d.ok) toast('¡Turno confirmado!', 'ok');
    cargarHoras();
    cargarMisTurnos();
  } catch (e) {
    msg.textContent = 'No se pudo conectar con el servidor';
  }
});

const SVG_RELOJ = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const SVG_CANCELAR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

function partesFecha(f) {
  const [a, m, d] = f.split('-').map(Number);
  const dt = new Date(a, m - 1, d);
  return {
    sem: dt.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', ''),
    dia: d,
    mes: dt.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
  };
}
function etiquetaRelativa(f) {
  const man = new Date(); man.setDate(man.getDate() + 1);
  if (f === hoy) return 'Hoy';
  if (f === iso(man)) return 'Mañana';
  return '';
}

async function cargarMisTurnos() {
  const cont = document.getElementById('misTurnos');
  if (!cont.children.length) cont.innerHTML = skeleton(2);
  try {
    const r = await fetch(`${API}/turnos.php?usuario_id=${usuario.id}`);
    const t = await r.json();
    cont.innerHTML = t.length ? t.map(x => {
      const p = partesFecha(x.fecha);
      const rel = etiquetaRelativa(x.fecha);
      return `
      <div class="card turno">
        <div class="turno-fecha">
          <span class="dia-sem">${esc(p.sem)}</span>
          <span class="dia-num">${p.dia}</span>
          <span class="mes">${esc(p.mes)}</span>
        </div>
        <div class="turno-info">
          <h3>${esc(x.servicio)}${rel ? ` <span class="chip-dia">${rel}</span>` : ''}</h3>
          <small class="servicio-dur">${SVG_RELOJ} ${x.hora_inicio.slice(0, 5)} a ${x.hora_fin.slice(0, 5)}</small>
        </div>
        <button class="btn-icono ic-borrar" onclick="cancelar(${x.id})" title="Cancelar turno" aria-label="Cancelar turno de ${esc(x.servicio)}">${SVG_CANCELAR}</button>
      </div>`;
    }).join('') : `<div class="vacio"><span>${ICO_CAL}</span><p>No tenés turnos próximos.</p></div>`;
  } catch (e) {
    cont.innerHTML = '<p>No se pudieron cargar tus turnos.</p>';
  }
}

async function cancelar(id) {
  if (!await confirmar('¿Cancelar este turno?', 'Cancelar turno')) return;
  await fetch(API + '/turnos.php', { method: 'DELETE', body: JSON.stringify({ id }) });
  cargarHoras();
  cargarMisTurnos();
}

function dibujarTira() {
  const cont = document.getElementById('tira');
  const b = new Date();
  let h = '';
  for (let i = 0; i < 14; i++) {
    const d = new Date(b.getFullYear(), b.getMonth(), b.getDate() + i);
    const f = iso(d);
    h += `<button type="button" class="dia-chip${f === tFecha.value ? ' sel' : ''}" data-f="${f}">
      <span>${d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}</span>
      <strong>${d.getDate()}</strong>
      <small>${d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</small></button>`;
  }
  cont.innerHTML = h;
  cont.querySelectorAll('.dia-chip').forEach(btn => btn.addEventListener('click', () => {
    tFecha.value = btn.dataset.f;
    cont.querySelectorAll('.dia-chip').forEach(x => x.classList.toggle('sel', x === btn));
    cargarHoras();
  }));
}

dibujarTira();
cargarServicios();
cargarMisTurnos();