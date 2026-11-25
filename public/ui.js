/* Utilidades de interfaz: avisos, confirmación, íconos y carga */
const _ic = (p, w = 22) => `<svg class="ic" viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;

const ICO_CAL = _ic('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>', 34);
const ICO_WA = _ic('<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.2A8.5 8.5 0 1 1 21 12z"/><path d="M9 9c0 3.3 2.7 6 6 6l1.2-1.6-2-1-.9.8a4 4 0 0 1-1.9-1.9l.8-.9-1-2z"/>', 18);

const ICONOS_CAT = {
  unas: '<path d="M12 2.7s6 6.2 6 10.5a6 6 0 0 1-12 0C6 8.9 12 2.7 12 2.7z"/>',
  cabello: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  cejas: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  maquillaje: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/>',
  masajes: '<path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 17-9 17z"/><path d="M4 21c3-6 6-9 10-11"/>',
  otro: '<path d="M12 3l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2z"/>'
};
ICONOS_CAT.pestanas = ICONOS_CAT.cejas;
ICONOS_CAT.barba = ICONOS_CAT.cabello;
ICONOS_CAT.depilacion = ICONOS_CAT.masajes;

function iconoCategoria(c) {
  const clave = (c || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return _ic(ICONOS_CAT[clave] || ICONOS_CAT.otro);
}

function skeleton(n = 3) {
  return '<div class="sk-lista" aria-hidden="true">' + '<div class="card sk"></div>'.repeat(n) + '</div>';
}

let _tToast;
function toast(texto, tipo = '') {
  let e = document.getElementById('toast');
  if (!e) {
    e = document.createElement('div');
    e.id = 'toast';
    e.setAttribute('role', 'status');
    document.body.appendChild(e);
  }
  e.className = 'toast ' + tipo;
  e.textContent = texto;
  requestAnimationFrame(() => e.classList.add('visible'));
  clearTimeout(_tToast);
  _tToast = setTimeout(() => e.classList.remove('visible'), 2800);
}

// Reemplaza a confirm(): devuelve una promesa true/false
function confirmar(texto, accion = 'Confirmar') {
  return new Promise(res => {
    const f = document.createElement('div');
    f.className = 'modal-fondo';
    f.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><p></p><button class="peligro" data-r="1"></button><button class="sec" data-r="0">Volver</button></div>';
    f.querySelector('p').textContent = texto;
    f.querySelector('.peligro').textContent = accion;
    document.body.appendChild(f);
    requestAnimationFrame(() => f.classList.add('visible'));
    const cerrar = v => { f.classList.remove('visible'); setTimeout(() => f.remove(), 250); res(v); };
    f.addEventListener('click', e => {
      if (e.target === f) return cerrar(false);
      const b = e.target.closest('button');
      if (b) cerrar(b.dataset.r === '1');
    });
  });
}