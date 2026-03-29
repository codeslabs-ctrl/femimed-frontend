export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  /** Mostrar enlace al chat en el menú (misma clave que Dr. Anderson / DemoMed). */
  chatMenuEnabled: true,
  /** Base del microservicio chatbot; '' = /api/chat en el mismo origen. */
  chatApiUrl: 'http://localhost:3999',
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
