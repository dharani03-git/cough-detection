const API_BASE_URL = (import.meta as any).env.VITE_API_URL || `http://${window.location.hostname}:8888`;

export default API_BASE_URL;
