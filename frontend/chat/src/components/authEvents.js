// src/utils/authEvents.js
export const AUTH_EVENTS = {
    LOGIN: 'auth:login',
    LOGOUT: 'auth:logout'
  };

  // Dispatch an auth event
  export function dispatchAuthEvent(eventType) {
    window.dispatchEvent(new Event(eventType));
  }
