const OJO_ABIERTO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const OJO_TACHADO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>';

document.querySelectorAll('input[type="password"]').forEach(input => {
  const envoltura = document.createElement('div');
  envoltura.className = 'pass-wrap';
  input.parentNode.insertBefore(envoltura, input);
  envoltura.appendChild(input);

  const ojo = document.createElement('button');
  ojo.type = 'button';
  ojo.className = 'ojo';
  ojo.innerHTML = OJO_ABIERTO;
  ojo.setAttribute('aria-label', 'Mostrar u ocultar contraseña');
  envoltura.appendChild(ojo);

  ojo.addEventListener('click', () => {
    const oculto = input.type === 'password';
    input.type = oculto ? 'text' : 'password';
    ojo.innerHTML = oculto ? OJO_TACHADO : OJO_ABIERTO;
  });
});