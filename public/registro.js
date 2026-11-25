const codigoInput = document.getElementById('codigo');
const desdeEnlace = new URLSearchParams(location.search).get('local');
if (desdeEnlace) codigoInput.value = desdeEnlace;

// Muestra el nombre del local al escribir el código
codigoInput.addEventListener('input', async () => {
  const out = document.getElementById('nombreLocalReg');
  const c = codigoInput.value.trim();
  if (c.length < 4) { out.textContent = ''; return; }
  try {
    const r = await fetch(`${API}/local.php?codigo=${encodeURIComponent(c)}`);
    const l = await r.json();
    out.textContent = l.nombre ? '✔ Te vas a registrar en: ' + l.nombre : 'Código no encontrado';
  } catch (e) {}
});

document.getElementById('btnRegistro').addEventListener('click', async () => {
  const msg = document.getElementById('msg');
  const datos = {
    codigo: codigoInput.value.trim(),
    nombre: document.getElementById('nombre').value.trim(),
    email: document.getElementById('email').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    password: document.getElementById('password').value
  };

  let tel = datos.telefono.replace(/\D/g, '');
  if (tel.startsWith('549')) tel = tel.slice(3);
  if (!datos.codigo || !datos.nombre || !datos.email || datos.password.length < 6 || tel.length < 10) {
    msg.textContent = 'Completá código, nombre, email, teléfono (10 dígitos) y contraseña (mínimo 6)';
    return;
  }
  datos.telefono = '549' + tel;

  try {
    const r = await fetch(API + '/registro.php', { method: 'POST', body: JSON.stringify(datos) });
    const d = await r.json();
    if (d.ok) { location.href = 'index.html'; }
    else { msg.textContent = d.error; }
  } catch (e) {
    msg.textContent = 'No se pudo conectar con el servidor';
  }
});