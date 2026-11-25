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

async function cargar() {
  const lista = document.getElementById('lista');
  try {
    const url = `${API}/turnos.php?lista=1&local_id=${usuario.local_id}&fecha=${fecha.value}`;
    const r = await fetch(url);
    const t = await r.json();
    if (!Array.isArray(t)) {
      lista.innerHTML = '<p>Error del servidor: ' + esc(t.error || 'respuesta inesperada') + '</p>';
      return;
    }
    if (!t.length) {
      lista.innerHTML = fecha.value
        ? `<p>No hay turnos el ${fechaAR(fecha.value)}.</p>`
        : '<p>No tenés turnos próximos.</p>';
      return;
    }

    let diaActual = '';
    lista.innerHTML = t.map(x => {
      let cab = '';
      if (x.fecha !== diaActual) {
        diaActual = x.fecha;
        cab = `<h3 class="dia-turnos">📅 ${fechaAR(x.fecha)}</h3>`;
      }
      const hora = x.hora_inicio.slice(0, 5);
      const texto = `Hola ${x.clienta}! Te recuerdo tu turno de ${x.servicio} el ${fechaAR(x.fecha)} a las ${hora}. Si no podés venir, avisame así reorganizo la agenda. ¡Gracias!`;
      const tel = (x.telefono || '').replace(/\D/g, '');
      const enviado = Number(x.recordatorio_enviado) === 1;
      return `${cab}
        <div class="card">
          <h3>${hora} a ${x.hora_fin.slice(0, 5)} · ${esc(x.clienta)}</h3>
          <small>${esc(x.servicio)}</small>
          ${enviado ? '<div class="enviado">✔ Recordatorio enviado</div>' : ''}
          <div class="acciones">
            ${tel
              ? `<a class="btn-wa" href="https://wa.me/${tel}?text=${encodeURIComponent(texto)}" target="_blank" onclick="marcar(${x.id})">📲 ${enviado ? 'Reenviar' : 'Enviar recordatorio'}</a>`
              : '<small>Sin teléfono cargado</small>'}
            <button class="borrar" onclick="cancelar(${x.id})">Cancelar</button>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    lista.innerHTML = '<p>No se pudieron cargar los turnos.</p>';
  }
}

async function marcar(id) {
  await fetch(API + '/turnos.php', { method: 'PUT', body: JSON.stringify({ id }) });
  setTimeout(cargar, 500);
}

async function cancelar(id) {
  if (!confirm('¿Cancelar este turno?')) return;
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