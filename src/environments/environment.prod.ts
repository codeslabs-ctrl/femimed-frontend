export const environment = {
  production: true,
  // URL del backend en producción: usa proxy reverso (sin puerto)
  // En este servidor, el vhost femimed.codes-labs.com proxyea /api -> http://localhost:3000/api
  // (no existe api.femimed.codes-labs.com).
  apiUrl: 'https://femimed.codes-labs.com/api/v1',
  chatMenuEnabled: false,
  chatApiUrl: '',
  appName: 'FemiMed Dashboard',
  version: '1.0.0',
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100
  },
  dateFormat: 'es-VE',
  currency: 'VES',
  timezone: 'America/Caracas'
};
