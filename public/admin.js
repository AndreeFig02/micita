const usuario = JSON.parse(localStorage.getItem('usuario'));
if (!usuario || usuario.rol !== 'admin') location.href = 'index.html';

document.getElementById('saludo').innerHTML =
  `Hola, ${usuario.nombre}<br><small>Código para tus clientas: <strong>${usuario.local_codigo}</strong></small>`;

const fecha = document.getElementById('fecha');

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

const SVG_CANCELAR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

function mananaISO() {
  const m = new Date(); m.setDate(m.getDate() + 1);
  return iso(m);
}

// "Hoy · miércoles 25/11", "Mañana · jueves 26/11" o "Viernes 27/11"
function etiquetaDia(f) {
  const [a, m, d] = f.split('-').map(Number);
  const dt = new Date(a, m - 1, d);
  const sem = dt.toLocaleDateString('es-AR', { weekday: 'long' });
  const txt = `${sem} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
  if (f === iso(new Date())) return `Hoy · ${txt}`;
  if (f === mananaISO()) return `Mañana · ${txt}`;
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

// Resalta el filtro activo (Próximos / Hoy / Mañana)
function marcarFiltro() {
  document.getElementById('btnTodos').classList.toggle('activo', fecha.value === '');
  document.getElementById('btnHoy').classList.toggle('activo', fecha.value === iso(new Date()));
  document.getElementById('btnManana').classList.toggle('activo', fecha.value === mananaISO());
}

function tarjetaTurno(x) {
  const hora = x.hora_inicio.slice(0, 5);
  const fin = x.hora_fin.slice(0, 5);
  const texto = `Hola ${x.clienta}! Te recuerdo tu turno de ${x.servicio} el ${fechaAR(x.fecha)} a las ${hora}. Si no podés venir, avisame así reorganizo la agenda. ¡Gracias!`;
  const tel = (x.telefono || '').replace(/\D/g, '');
  const enviado = Number(x.recordatorio_enviado) === 1;
  return `
    <div class="card turno-admin">
      <div class="turno-admin-fila">
        <div class="turno-hora"><strong>${hora}</strong><small>a ${fin}</small></div>
        <div class="turno-info">
          <h3>${esc(x.clienta)}</h3>
          <small>${esc(x.servicio)}</small>
          ${enviado ? '<div class="enviado">✔ Recordatorio enviado</div>' : ''}
        </div>
      </div>
      <div class="acciones">
        ${tel
          ? `<a class="btn-wa" href="https://wa.me/${tel}?text=${encodeURIComponent(texto)}" target="_blank" onclick="marcar(${x.id})">${ICO_WA} ${enviado ? 'Reenviar' : 'Enviar recordatorio'}</a>`
          : '<small>Sin teléfono cargado</small>'}
        <button class="btn-icono ic-borrar" onclick="cancelar(${x.id})" title="Cancelar turno" aria-label="Cancelar turno de ${esc(x.clienta)}">${SVG_CANCELAR}</button>
      </div>
    </div>`;
}

async function cargar() {
  marcarFiltro();
  const lista = document.getElementById('lista');
  if (!lista.children.length) lista.innerHTML = skeleton(3);
  try {
    const url = `${API}/turnos.php?lista=1&local_id=${usuario.local_id}&fecha=${fecha.value}`;
    const r = await fetch(url);
    const t = await r.json();
    if (!Array.isArray(t)) {
      lista.innerHTML = '<p>Error del servidor: ' + esc(t.error || 'respuesta inesperada') + '</p>';
      return;
    }
    if (!t.length) {
      lista.innerHTML = `<div class="vacio"><span>${ICO_CAL}</span><p>${fecha.value
        ? `No hay turnos el ${fechaAR(fecha.value)}.`
        : 'No tenés turnos próximos.'}</p></div>`;
      return;
    }

    // Agrupar por día (la API ya devuelve los turnos ordenados)
    const dias = [];
    t.forEach(x => {
      let g = dias[dias.length - 1];
      if (!g || g.fecha !== x.fecha) { g = { fecha: x.fecha, items: [] }; dias.push(g); }
      g.items.push(x);
    });

    lista.innerHTML = dias.map(g => `
      <div class="dia-cab">
        <span class="dia-titulo">${etiquetaDia(g.fecha)}</span>
        <span class="dia-cant">${g.items.length} turno${g.items.length === 1 ? '' : 's'}</span>
      </div>
      ${g.items.map(tarjetaTurno).join('')}`).join('');
  } catch (e) {
    lista.innerHTML = '<p>No se pudieron cargar los turnos.</p>';
  }
}

async function marcar(id) {
  await fetch(API + '/turnos.php', { method: 'PUT', body: JSON.stringify({ id }) });
  setTimeout(cargar, 500);
}

async function cancelar(id) {
  if (!await confirmar('¿Cancelar este turno?', 'Cancelar turno')) return;
  await fetch(API + '/turnos.php', { method: 'DELETE', body: JSON.stringify({ id }) });
  cargar();
}

document.getElementById('btnTodos').addEventListener('click', () => { fecha.value = ''; cargar(); });
document.getElementById('btnHoy').addEventListener('click', () => { fecha.value = iso(new Date()); cargar(); });
document.getElementById('btnManana').addEventListener('click', () => {
  const m = new Date(); m.setDate(m.getDate() + 1);
  fecha.value = iso(m); cargar();
});
fecha.addEventListener('change', cargar);

cargar();