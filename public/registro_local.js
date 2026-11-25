document.getElementById('btnLocal').addEventListener('click', async () => {
  const msg = document.getElementById('msg');
  const datos = {
    local: document.getElementById('local').value.trim(),
    nombre: document.getElementById('nombre').value.trim(),
    email: document.getElementById('email').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    password: document.getElementById('password').value
  };

  let tel = datos.telefono.replace(/\D/g, '');
  if (tel.startsWith('549')) tel = tel.slice(3);
  if (!datos.local || !datos.nombre || !datos.email || datos.password.length < 6 || tel.length < 10) {
    msg.textContent = 'Completá todos los campos (teléfono de 10 dígitos y contraseña de mínimo 6)';
    return;
  }
  datos.telefono = '549' + tel;

  try {
    const r = await fetch(API + '/registro_local.php', { method: 'POST', body: JSON.stringify(datos) });
    const d = await r.json();
    if (d.ok) {
      alert('¡Local creado! El código para tus clientas es: ' + d.codigo + '\nLo vas a ver siempre en tu panel.');
      location.href = 'index.html';
    } else {
      msg.textContent = d.error;
    }
  } catch (e) {
    msg.textContent = 'No se pudo conectar con el servidor';
  }
});