document.getElementById('btnLogin').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const msg = document.getElementById('msg');

  if (!email || !password) { msg.textContent = 'Completá todos los campos'; return; }

  try {
    const r = await fetch(API + '/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const d = await r.json();

    if (d.ok) {
      localStorage.setItem('usuario', JSON.stringify(d.usuario));
      location.href = d.usuario.rol === 'admin' ? 'admin.html' : 'servicios.html';
    } else {
      msg.textContent = d.error;
    }
  } catch (e) {
    msg.textContent = 'No se pudo conectar con el servidor';
  }
});