import { environment } from '../../environments/environment';

export const APP_CONFIG = {
  // API Configuration
  API_BASE_URL: environment.apiUrl,
  API_ENDPOINTS: {
    PATIENTS: '/patients',
    PATIENT_BY_ID: (id: number) => `/patients/${id}`,
    PATIENT_BY_EMAIL: (email: string) => `/patients/email/${email}`,
    PATIENT_SEARCH: '/patients/search',
    PATIENT_AGE_RANGE: '/patients/age-range',
    PATIENT_STATISTICS: '/patients/statistics'
  },

  // Application Configuration
  APP_NAME: environment.appName,
  VERSION: environment.version,

  // Pagination Configuration
  PAGINATION: {
    DEFAULT_PAGE_SIZE: environment.pagination.defaultPageSize,
    MAX_PAGE_SIZE: environment.pagination.maxPageSize,
    PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100]
  },

  // Date and Time Configuration
  DATE_FORMAT: environment.dateFormat,
  TIMEZONE: environment.timezone,
  CURRENCY: environment.currency,

  // UI Configuration
  UI: {
    DEBOUNCE_TIME: 300,
    ANIMATION_DURATION: 200,
    TOAST_DURATION: 3000
  },

  // Validation Configuration
  VALIDATION: {
    EMAIL_PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PHONE_PATTERN: /^[\+]?[1-9][\d]{0,15}$/,
    MIN_AGE: 0,
    MAX_AGE: 120,
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 50
  },

  // Storage Keys
  STORAGE_KEYS: {
    USER_PREFERENCES: 'femimed_user_preferences',
    FILTERS: 'femimed_patient_filters',
    THEME: 'femimed_theme'
  }
};
