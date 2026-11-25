(function () {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario) return;

  const esc = t => { const e = document.createElement('div'); e.textContent = t ?? ''; return e.innerHTML; };
  const ic = p => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    panel: ic('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
    horarios: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    servicios: ic('<path d="M12 3l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2z"/>'),
    local: ic('<path d="M4 10l1.5-5h13L20 10"/><path d="M4 10a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5 12v8h14v-8"/>'),
    turno: ic('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4"/>'),
    salir: ic('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/>')
  };

  const items = usuario.rol === 'admin'
    ? [
        { texto: 'Turnos', href: 'admin.html', icono: I.panel },
        { texto: 'Horarios', href: 'horarios.html', icono: I.horarios },
        { texto: 'Servicios', href: 'servicios.html', icono: I.servicios },
        { texto: 'Mi local', href: 'mi_local.html', icono: I.local }
      ]
    : [
        { texto: 'Servicios', href: 'servicios.html', icono: I.servicios },
        { texto: 'Sacar turno', href: 'turnos.html', icono: I.turno }
      ];

  const actual = location.pathname.split('/').pop();
  const local = esc(usuario.local_nombre || 'MiCita');

  document.body.classList.add('con-menu');
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="barra-local">
      <span class="nombre-local">${local}</span>
      <button id="menuSalir" class="salir-btn" aria-label="Cerrar sesión" title="Cerrar sesión">${I.salir}</button>
    </div>
    <nav class="nav-inf" aria-label="Navegación principal">
      ${items.map(i => `<a href="${i.href}" class="${i.href === actual ? 'activo' : ''}" ${i.href === actual ? 'aria-current="page"' : ''}>
        <span class="nav-ic">${i.icono}</span>${i.texto}</a>`).join('')}
    </nav>
  `);

  document.getElementById('menuSalir').addEventListener('click', async () => {
    const ok = typeof confirmar === 'function' ? await confirmar('¿Querés cerrar sesión?', 'Cerrar sesión') : true;
    if (!ok) return;
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