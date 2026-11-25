const usuario = JSON.parse(localStorage.getItem('usuario'));
if (!usuario || usuario.rol !== 'admin') location.href = 'index.html';

const NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ORDEN = [1, 2, 3, 4, 5, 6, 0];
const msg = document.getElementById('msg');

async function cargar() {
  const cont = document.getElementById('dias');
  try {
    const r = await fetch(`${API}/horarios.php?local_id=${usuario.local_id}`);
    const datos = await r.json();
    cont.innerHTML = ORDEN.map(n => {
      const x = datos.find(d => Number(d.dia) === n) || { activo: 0, desde: '09:00', hasta: '18:00' };
      return `
        <div class="card fila-dia" data-dia="${n}">
          <label class="chk"><input type="checkbox" class="activo" ${Number(x.activo) ? 'checked' : ''}> ${NOMBRES[n]}</label>
          <div class="rangos">
            <div class="rango">
              <small>Turno 1</small>
              <input type="time" class="desde" value="${x.desde || '09:00'}">
              <span>a</span>
              <input type="time" class="hasta" value="${x.hasta || '13:00'}">
            </div>
            <div class="rango">
              <small>Turno 2</small>
              <input type="time" class="desde2" value="${x.desde2 || ''}">
              <span>a</span>
              <input type="time" class="hasta2" value="${x.hasta2 || ''}">
            </div>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    cont.innerHTML = '<p>No se pudieron cargar los horarios.</p>';
  }
}

document.getElementById('btnGuardar').addEventListener('click', async () => {
  const dias = [...document.querySelectorAll('.fila-dia')].map(f => ({
    dia: Number(f.dataset.dia),
    activo: f.querySelector('.activo').checked,
    desde: f.querySelector('.desde').value,
    hasta: f.querySelector('.hasta').value,
    desde2: f.querySelector('.desde2').value,
    hasta2: f.querySelector('.hasta2').value
  }));
  try {
    const r = await fetch(API + '/horarios.php', {
      method: 'PUT',
      body: JSON.stringify({ dias, local_id: usuario.local_id })
    });
    const d = await r.json();
    msg.style.color = d.ok ? '#1e8e5a' : '';
    msg.textContent = d.ok ? '¡Horarios guardados!' : d.error;
  } catch (e) {
    msg.style.color = '';
    msg.textContent = 'No se pudo conectar con el servidor';
  }
});

cargar();