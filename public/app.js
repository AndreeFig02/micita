const form = document.getElementById('formLogin');
const btn = document.getElementById('btnLogin');
const msg = document.getElementById('msg');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  msg.textContent = '';

  if (!email || !password) {
    msg.textContent = 'Completá tu email y tu contraseña';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Ingresando…';

  try {
    const r = await fetch(API + '/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const d = await r.json();

    if (d.ok) {
      localStorage.setItem('usuario', JSON.stringify(d.usuario));
      location.href = d.usuario.rol === 'admin' ? 'admin.html' : 'servicios.html';
      return;
    }
    msg.textContent = d.error;
  } catch (err) {
    msg.textContent = 'No se pudo conectar con el servidor. Revisá tu conexión.';
  }

  btn.disabled = false;
  btn.textContent = 'Ingresar';
});