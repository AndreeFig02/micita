(function () {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario) return;

  const items = usuario.rol === 'admin'
    ? [
        { texto: 'Panel de turnos', href: 'admin.html' },
        { texto: 'Definir horarios', href: 'horarios.html' },
        { texto: 'Gestionar servicios', href: 'servicios.html' },
        { texto: 'Mi local', href: 'mi_local.html' }
      ]
    : [
        { texto: 'Servicios', href: 'servicios.html' },
        { texto: 'Sacar turno', href: 'turnos.html' }
      ];

  const actual = location.pathname.split('/').pop();
  const local = usuario.local_nombre || 'MiCita';

  document.body.classList.add('con-menu');
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="barra-local"><span class="nombre-local">${local}</span></div>
    <button id="menuBtn" class="menu-btn" aria-label="Abrir menú">☰</button>
    <div id="menuFondo" class="menu-fondo"></div>
    <nav id="menuLateral" class="menu-lateral">
      <div class="menu-cabecera">
        <strong class="nombre-local">${local}</strong>
        <small>${usuario.nombre}</small>
      </div>
      ${items.map(i => `<a href="${i.href}" class="${i.href === actual ? 'activo' : ''}">${i.texto}</a>`).join('')}
      <a href="#" id="menuSalir" class="menu-salir">Cerrar sesión</a>
    </nav>
  `);

  const menu = document.getElementById('menuLateral');
  const fondo = document.getElementById('menuFondo');

  function alternar(abrir) {
    menu.classList.toggle('abierto', abrir);
    fondo.classList.toggle('abierto', abrir);
  }

  document.getElementById('menuBtn').addEventListener('click', () => alternar(true));
  fondo.addEventListener('click', () => alternar(false));
  document.getElementById('menuSalir').addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem('usuario');
    location.href = 'index.html';
  });

  // Refresca el nombre del local desde el servidor
  fetch(`${API}/local.php?local_id=${usuario.local_id}`)
    .then(r => r.json())
    .then(l => {
      if (!l.nombre) return;
      document.querySelectorAll('.nombre-local').forEach(e => e.textContent = l.nombre);
      usuario.local_nombre = l.nombre;
      localStorage.setItem('usuario', JSON.stringify(usuario));
    })
    .catch(() => {});
})();