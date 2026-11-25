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

async function cargarServicios() {
  try {
    const r = await fetch(`${API}/servicios.php?local_id=${usuario.local_id}`);
    const lista = await r.json();
    document.getElementById('tServicio').innerHTML = lista
      .map(s => `<option value="${s.id}">${esc(s.nombre)} (${s.duracion_min} min)</option>`).join('');
    cargarHoras();
  } catch (e) {
    msg.textContent = 'No se pudieron cargar los servicios';
  }
}

async function cargarHoras() {
  horaElegida = null;
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
    if (d.ok) alert('¡Turno confirmado!');
    cargarHoras();
    cargarMisTurnos();
  } catch (e) {
    msg.textContent = 'No se pudo conectar con el servidor';
  }
});

async function cargarMisTurnos() {
  const cont = document.getElementById('misTurnos');
  try {
    const r = await fetch(`${API}/turnos.php?usuario_id=${usuario.id}`);
    const t = await r.json();
    cont.innerHTML = t.length ? t.map(x => `
      <div class="card">
        <h3>${esc(x.servicio)}</h3>
        <small>${fechaAR(x.fecha)} · ${x.hora_inicio.slice(0, 5)} a ${x.hora_fin.slice(0, 5)}</small>
        <button class="borrar" onclick="cancelar(${x.id})">Cancelar</button>
      </div>`).join('') : '<p>No tenés turnos próximos.</p>';
  } catch (e) {
    cont.innerHTML = '<p>No se pudieron cargar tus turnos.</p>';
  }
}

async function cancelar(id) {
  if (!confirm('¿Cancelar este turno?')) return;
  await fetch(API + '/turnos.php', { method: 'DELETE', body: JSON.stringify({ id }) });
  cargarHoras();
  cargarMisTurnos();
}

cargarServicios();
cargarMisTurnos();