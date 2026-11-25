const usuario = JSON.parse(localStorage.getItem('usuario'));
if (!usuario || usuario.rol !== 'admin') location.href = 'index.html';

const inNombre = document.getElementById('inNombre');
const msg = document.getElementById('msg');
inNombre.value = usuario.local_nombre || '';
document.getElementById('codigoLocal').textContent = usuario.local_codigo || '';

document.getElementById('btnGuardarLocal').addEventListener('click', async () => {
  const nombre = inNombre.value.trim();
  if (!nombre) { msg.style.color = ''; msg.textContent = 'Ingresá el nombre de tu local'; return; }
  try {
    const r = await fetch(API + '/local.php', {
      method: 'PUT',
      body: JSON.stringify({ nombre, local_id: usuario.local_id })
    });
    const d = await r.json();
    if (d.ok) {
      usuario.local_nombre = nombre;
      localStorage.setItem('usuario', JSON.stringify(usuario));
      document.querySelectorAll('.nombre-local').forEach(e => e.textContent = nombre);
      msg.style.color = '#2e7d32';
      msg.textContent = '¡Nombre guardado!';
    } else {
      msg.style.color = '';
      msg.textContent = d.error;
    }
  } catch (e) {
    msg.style.color = '';
    msg.textContent = 'No se pudo conectar con el servidor';
  }
});