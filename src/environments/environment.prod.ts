export const environment = {
  production: true,
  // URL del backend en producción: usa proxy reverso (sin puerto)
  // El proxy Apache/Nginx maneja HTTPS en puerto 443 y redirige a HTTP localhost:3001
  apiUrl: 'https://api.femimed.codes-labs.com/api/v1',
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
