const isLocal = window.location.hostname === 'localhost';
const protocol = window.location.protocol;
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 
    (isLocal ? `http://localhost:8888` : `${protocol}//${window.location.hostname}`);

export default API_BASE_URL;
