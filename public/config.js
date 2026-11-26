const URL_SERVIDOR = 'https://micita-production-56e0f4b0.up.railway.app';

const esApp = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
const API = esApp
  ? URL_SERVIDOR + '/api'
  : (location.pathname.includes('/micita/') ? '/micita/api' : '/api');